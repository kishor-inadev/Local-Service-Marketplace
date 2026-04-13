import { Injectable, Inject, LoggerService } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";
import { JobRepository } from "../repositories/job.repository";
import { CreateJobDto } from "../dto/create-job.dto";
import { UpdateJobStatusDto, JobStatus } from "../dto/update-job-status.dto";
import {
  JobResponseDto,
  PaginatedJobResponseDto,
} from "../dto/job-response.dto";
import { JobQueryDto, JobSortBy, SortOrder } from "../dto/job-query.dto";
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from "../../../common/exceptions/http.exceptions";
import {
  validateCursorMode,
  validateDateRange,
} from "../../../common/pagination/list-query-validation.util";
import { KafkaService } from "../../../kafka/kafka.service";
import { RedisService } from "../../../redis/redis.service";
import { NotificationClient } from "../../../common/notification/notification.client";
import { UserClient } from "../../../common/user/user.client";
import { AnalyticsClient } from "../../../common/analytics/analytics.client";

@Injectable()
export class JobService {
  private readonly JOB_CACHE_TTL = 180; // 3 minutes (jobs change status frequently)
  private readonly workersEnabled: boolean;

  constructor(
    private readonly jobRepository: JobRepository,
    private readonly kafkaService: KafkaService,
    private readonly redisService: RedisService,
    private readonly notificationClient: NotificationClient,
    private readonly userClient: UserClient,
    private readonly analyticsClient: AnalyticsClient,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    @InjectQueue('marketplace.notification') private readonly notificationQueue: Queue,
  ) {
    this.workersEnabled = process.env.WORKERS_ENABLED === 'true';
  }

  async createJob(dto: CreateJobDto): Promise<JobResponseDto> {
    this.logger.log(
      `Creating job for request ${dto.request_id} with provider ${dto.provider_id}`,
      JobService.name,
    );

    // Check if job already exists for this request
    const existingJob = await this.jobRepository.getJobByRequestId(
      dto.request_id,
    );
    if (existingJob) {
      throw new ConflictException("Job already exists for this request");
    }

    const job = await this.jobRepository.createJob(dto);

    this.logger.log(`Job created successfully: ${job.id}`, JobService.name);

    // Notify provider (job assigned) — queue if workers enabled, else inline
    if (this.workersEnabled) {
      this.notificationQueue
        .add('notify-job-assigned', {
          providerId: job.provider_id,
          jobId: job.id,
          requestId: job.request_id,
        })
        .catch((err: any) => {
          this.logger.warn(
            `Failed to enqueue job assigned notification: ${err.message}`,
            JobService.name,
          );
        });
    } else {
      this.userClient.getProviderEmail(dto.provider_id).then((providerEmail) => {
        if (!providerEmail) return;
        this.notificationClient.sendEmail({
          to: providerEmail,
          template: 'MARKETPLACE_JOB_ASSIGNED',
          variables: {
            providerName: providerEmail.split('@')[0],
            requestTitle: 'Service Request',
            customerName: 'Customer',
            price: 'Agreed price',
            startDate: new Date().toLocaleDateString('en-IN'),
            jobDisplayId: job.id,
            jobUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/jobs/${job.id}`,
          },
        });
      }).catch((err: any) => {
        this.logger.warn(
          `Failed to send job assigned email: ${err.message}`,
          JobService.name,
        );
      });
    }

    // Publish event to Kafka if enabled
    await this.kafkaService.publishEvent("job-events", {
      eventType: "job_created",
      eventId: `${job.id}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        jobId: job.id,
        requestId: job.request_id,
        providerId: job.provider_id,
        status: job.status,
      },
    });

    // Track analytics (HTTP fallback when Kafka is disabled)
    this.analyticsClient.track({
      userId: dto.customer_id,
      action: "job_created",
      resource: "job",
      resourceId: job.id,
      metadata: {
        providerId: job.provider_id,
        requestId: job.request_id,
        status: job.status,
      },
    });

    return JobResponseDto.fromEntity(job);
  }

  async getJobById(id: string): Promise<JobResponseDto> {
    this.logger.log(`Fetching job: ${id}`, JobService.name);

    // Try cache first
    if (this.redisService.isCacheEnabled()) {
      const cacheKey = `job:${id}`;
      const cached = await this.redisService.get(cacheKey);

      if (cached) {
        this.logger.log(`Cache hit for job: ${id}`, JobService.name);
        return JSON.parse(cached);
      }
    }

    const job = await this.jobRepository.getJobById(id);

    if (!job) {
      throw new NotFoundException("Job not found");
    }

    const response = JobResponseDto.fromEntity(job);

    // Cache the result
    if (this.redisService.isCacheEnabled()) {
      const cacheKey = `job:${id}`;
      await this.redisService.set(
        cacheKey,
        JSON.stringify(response),
        this.JOB_CACHE_TTL,
      );
    }

    return response;
  }

  async updateJobStatus(
    id: string,
    dto: UpdateJobStatusDto,
    userId: string,
    userRole: string,
    userPermissions?: string[],
  ): Promise<JobResponseDto> {
    this.logger.log(
      `Updating job status: ${id} to ${dto.status}`,
      JobService.name,
    );

    // Validate job exists
    const existingJob = await this.jobRepository.getJobById(id);
    if (!existingJob) {
      throw new NotFoundException("Job not found");
    }

    // Ownership check: only the customer, provider, or user with manage permission can update
    if (
      !userPermissions?.includes('jobs.manage') &&
      existingJob.customer_id !== userId &&
      existingJob.provider_id !== userId
    ) {
      throw new ForbiddenException("You are not authorized to update this job");
    }

    // Validate status transition
    if (existingJob.status === "completed") {
      throw new BadRequestException("Cannot update status of completed job");
    }

    if (existingJob.status === "cancelled") {
      throw new BadRequestException("Cannot update status of cancelled job");
    }

    // Role-based transition enforcement
    const isCustomer = existingJob.customer_id === userId;
    const isProvider = existingJob.provider_id === userId;

    if (!userPermissions?.includes('jobs.manage')) {
      const customerAllowed = ["completed", "disputed"];
      const providerAllowed = ["in_progress", "completed"];

      if (isCustomer && !customerAllowed.includes(dto.status)) {
        throw new ForbiddenException(
          `Customers can only set job status to: ${customerAllowed.join(", ")}`,
        );
      }

      // Customer can only mark completed if the job is already in_progress
      if (isCustomer && dto.status === "completed" && existingJob.status !== "in_progress") {
        throw new BadRequestException(
          "Job must be in progress before it can be marked as completed",
        );
      }

      if (isProvider && !providerAllowed.includes(dto.status)) {
        throw new ForbiddenException(
          `Providers can only set job status to: ${providerAllowed.join(", ")}`,
        );
      }

      // Provider must move to in_progress first before completing
      if (isProvider && dto.status === "completed" && existingJob.status !== "in_progress") {
        throw new BadRequestException(
          "Job must be in progress before it can be marked as completed",
        );
      }
    }

    const job = await this.jobRepository.updateJobStatus(
      existingJob.id,
      dto.status,
    );

    this.logger.log(
      `Job status updated successfully: ${existingJob.id}`,
      JobService.name,
    );

    // Invalidate cache
    if (this.redisService.isCacheEnabled()) {
      await this.redisService.del(`job:${existingJob.id}`);
    }

    // Publish event to Kafka if enabled
    await this.kafkaService.publishEvent("job-events", {
      eventType:
        dto.status === "in_progress" ? "job_started" : `job_${dto.status}`,
      eventId: `${job.id}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        jobId: job.id,
        requestId: job.request_id,
        providerId: job.provider_id,
        status: job.status,
      },
    });

    // Notify other party about status change — queue if workers enabled, else inline
    const notifyUserId = existingJob.provider_id === userId
      ? existingJob.customer_id
      : existingJob.provider_id;
    if (this.workersEnabled) {
      this.notificationQueue
        .add('notify-job-status-changed', {
          userId: notifyUserId,
          jobId: job.id,
          newStatus: dto.status,
        })
        .catch((err: any) => {
          this.logger.warn(
            `Failed to enqueue job status notification: ${err.message}`,
            JobService.name,
          );
        });
    } else {
      this.userClient.getUserEmail(notifyUserId).then((email) => {
        if (!email) return;
        this.notificationClient.sendEmail({
          to: email,
          template: 'MESSAGE_RECEIVED',
          variables: {
            recipientName: email.split('@')[0],
            senderName: 'LocalServices',
            messagePreview: `Your job #${job.id} status has been updated to: ${dto.status}`,
            replyUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/jobs/${job.id}`,
          },
        });
      }).catch((err: any) => {
        this.logger.warn(
          `Failed to send job status email: ${err.message}`,
          JobService.name,
        );
      });
    }

    // Track analytics (HTTP fallback when Kafka is disabled)
    this.analyticsClient.track({
      userId: userId,
      action:
        dto.status === "in_progress" ? "job_started" : `job_${dto.status}`,
      resource: "job",
      resourceId: job.id,
      metadata: { status: job.status, providerId: job.provider_id },
    });

    return JobResponseDto.fromEntity(job);
  }

  async completeJob(
    id: string,
    userId: string,
    userRole: string,
    userPermissions?: string[],
  ): Promise<JobResponseDto> {
    this.logger.log(`Completing job: ${id}`, JobService.name);

    // Validate job exists
    const existingJob = await this.jobRepository.getJobById(id);
    if (!existingJob) {
      throw new NotFoundException("Job not found");
    }

    // Ownership check: only the customer or user with manage permission can complete a job
    if (!userPermissions?.includes?.('jobs.manage') && existingJob.customer_id !== userId) {
      throw new ForbiddenException(
        "Only the customer or an admin can complete a job",
      );
    }

    // Validate job is in progress
    if (existingJob.status === "completed") {
      throw new BadRequestException("Job is already completed");
    }

    if (existingJob.status === "cancelled") {
      throw new BadRequestException("Cannot complete a cancelled job");
    }

    const job = await this.jobRepository.completeJob(existingJob.id);

    this.logger.log(
      `Job completed successfully: ${existingJob.id}`,
      JobService.name,
    );

    // Invalidate cache
    if (this.redisService.isCacheEnabled()) {
      await this.redisService.del(`job:${existingJob.id}`);
    }

    // Publish event to Kafka if enabled
    await this.kafkaService.publishEvent("job-events", {
      eventType: "job_completed",
      eventId: `${job.id}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        jobId: job.id,
        requestId: job.request_id,
        providerId: job.provider_id,
        status: job.status,
      },
    });

    // Notify both customer and provider — queue if workers enabled, else inline
    if (this.workersEnabled) {
      this.notificationQueue
        .add('notify-job-completed', {
          customerId: existingJob.customer_id,
          providerId: existingJob.provider_id,
          jobId: job.id,
        })
        .catch((err: any) => {
          this.logger.warn(
            `Failed to enqueue job completion notification: ${err.message}`,
            JobService.name,
          );
        });
    } else {
      Promise.all([
        this.userClient.getUserEmail(existingJob.customer_id),
        this.userClient.getUserEmail(existingJob.provider_id),
      ]).then(([customerEmail, providerEmail]) => {
        if (customerEmail) {
          this.notificationClient.sendEmail({
            to: customerEmail,
            template: 'ORDER_DELIVERED',
            variables: {
              username: customerEmail.split('@')[0],
              orderId: job.id,
              deliveryDate: new Date().toLocaleDateString('en-IN'),
              deliveryAddress: 'At your service location',
            },
          });
        }
        if (providerEmail) {
          this.notificationClient.sendEmail({
            to: providerEmail,
            template: 'MARKETPLACE_PAYMENT_RECEIVED',
            variables: {
              providerName: providerEmail.split('@')[0],
              amount: 'Agreed amount',
              jobTitle: `Job #${job.id}`,
              customerName: 'Customer',
              paymentDisplayId: job.id,
              dashboardUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/provider/dashboard`,
            },
          });
        }
      }).catch((err: any) => {
        this.logger.warn(
          `Failed to send job completion email: ${err.message}`,
          JobService.name,
        );
      });
    }

    // Track analytics (HTTP fallback when Kafka is disabled)
    this.analyticsClient.track({
      userId: userId,
      action: "job_completed",
      resource: "job",
      resourceId: job.id,
      metadata: { providerId: job.provider_id, requestId: job.request_id },
    });

    return JobResponseDto.fromEntity(job);
  }

  async getJobsByProvider(
    providerId: string,
  ): Promise<{ data: JobResponseDto[]; total: number }> {
    this.logger.log(
      `Fetching jobs for provider: ${providerId}`,
      JobService.name,
    );

    const jobs = await this.jobRepository.getJobsByProvider(providerId);
    const data = jobs.map(JobResponseDto.fromEntity);

    return { data, total: data.length };
  }

  async getJobsByStatus(
    status: string,
    user?: any,
  ): Promise<{ data: JobResponseDto[]; total: number }> {
    this.logger.log(
      `Fetching jobs with status: ${status} for user ${user?.userId}`,
      JobService.name,
    );

    // RBAC: Restricted view — users with manage permission see all
    if (user && !user.permissions?.includes('jobs.manage')) {
      if (user.role === "customer") {
        const jobs = await this.jobRepository.getJobsByCustomer(user.userId);
        const data = jobs
          .filter((j) => j.status === status)
          .map(JobResponseDto.fromEntity);
        return { data, total: data.length };
      }

      if (user.role === "provider") {
        const providerId = user.providerId || user.userId;
        const jobs = await this.jobRepository.getJobsByProvider(providerId);
        const data = jobs
          .filter((j) => j.status === status)
          .map(JobResponseDto.fromEntity);
        return { data, total: data.length };
      }
    }

    const jobs = await this.jobRepository.getJobsByStatus(status);
    const data = jobs.map(JobResponseDto.fromEntity);

    return { data, total: data.length };
  }

  async getJobsByCustomer(
    userId: string,
  ): Promise<{ data: JobResponseDto[]; total: number }> {
    this.logger.log(`Fetching jobs for customer: ${userId}`, JobService.name);

    const jobs = await this.jobRepository.getJobsByCustomer(userId);
    const data = jobs.map(JobResponseDto.fromEntity);

    return { data, total: data.length };
  }

  async getJobsByProviderUser(
    userId: string,
  ): Promise<{ data: JobResponseDto[]; total: number }> {
    this.logger.log(
      `Fetching jobs for provider user: ${userId}`,
      JobService.name,
    );

    const jobs = await this.jobRepository.getJobsByProviderUser(userId);
    const data = jobs.map(JobResponseDto.fromEntity);

    return { data, total: data.length };
  }

  async getJobs(
    queryDto: JobQueryDto,
    user?: any,
  ): Promise<PaginatedJobResponseDto> {
    this.logger.log(
      `Fetching jobs with filters: ${JSON.stringify(queryDto)} for user ${user?.userId}`,
      JobService.name,
    );

    // RBAC: Enforce owner/participant filtering unless user has manage permission
    if (user && !user.permissions?.includes('jobs.manage')) {
      if (user.role === "customer") {
        queryDto.customer_id = user.userId;
      } else if (user.role === "provider") {
        queryDto.provider_id = user.providerId || user.userId;
      }
    }

    validateDateRange(
      queryDto.started_from,
      queryDto.started_to,
      "started_from",
      "started_to",
    );
    validateDateRange(
      queryDto.completed_from,
      queryDto.completed_to,
      "completed_from",
      "completed_to",
    );
    validateCursorMode(
      queryDto.cursor,
      queryDto.page,
      queryDto.sortBy,
      queryDto.sortOrder,
      JobSortBy.STARTED_AT,
      SortOrder.DESC,
    );

    const limit = queryDto.limit || 20;

    if (queryDto.cursor) {
      const jobs = await this.jobRepository.getJobsPaginated(queryDto);
      const hasMore = jobs.length > limit;
      const data = jobs.slice(0, limit);
      const nextCursor = hasMore ? data[data.length - 1].id : undefined;
      const response = data.map(JobResponseDto.fromEntity);
      return new PaginatedJobResponseDto(
        response,
        nextCursor,
        hasMore,
        undefined,
        queryDto.page || 1,
        limit,
      );
    }

    const [jobs, total] = await Promise.all([
      this.jobRepository.getJobsPaginated(queryDto),
      this.jobRepository.countJobs(queryDto),
    ]);
    const response = jobs.map(JobResponseDto.fromEntity);
    return new PaginatedJobResponseDto(
      response,
      undefined,
      false,
      total,
      queryDto.page || 1,
      limit,
    );
  }

  async getJobStats(): Promise<{
    total: number;
    byStatus: {
      scheduled: number;
      in_progress: number;
      completed: number;
      cancelled: number;
      disputed: number;
    };
  }> {
    this.logger.log(`Fetching job stats`, JobService.name);
    return this.jobRepository.getJobStats();
  }

  async deleteJob(
    id: string,
    userId: string,
    userRole: string,
    reason?: string,
    userPermissions?: string[],
  ): Promise<void> {
    this.logger.log(`Deleting/cancelling job: ${id}`, JobService.name);

    // Validate job exists
    const existingJob = await this.jobRepository.getJobById(id);
    if (!existingJob) {
      throw new NotFoundException("Job not found");
    }

    // Ownership check: customer, provider, or user with manage permission can cancel
    const isCustomer = existingJob.customer_id === userId;
    const isProvider = existingJob.provider_id === userId;
    const isAdmin = userPermissions?.includes?.('jobs.manage');

    if (!isCustomer && !isProvider && !isAdmin) {
      throw new ForbiddenException(
        "You can only delete jobs you are involved in",
      );
    }

    // Status check: Only pending or scheduled jobs can be cancelled
    if (
      existingJob.status !== "pending" &&
      existingJob.status !== "scheduled"
    ) {
      throw new BadRequestException(
        `Cannot delete job with status: ${existingJob.status}. Only pending or scheduled jobs can be cancelled.`,
      );
    }

    // Cancel the job
    await this.jobRepository.cancelJob(existingJob.id, userId, reason ?? 'Cancelled by user');

    this.logger.log(
      `Job cancelled successfully: ${existingJob.id}`,
      JobService.name,
    );

    // Invalidate cache
    if (this.redisService.isCacheEnabled()) {
      await this.redisService.del(`job:${existingJob.id}`);
    }

    // Publish event to Kafka if enabled
    await this.kafkaService.publishEvent("job-events", {
      eventType: "job_cancelled",
      eventId: `${existingJob.id}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        jobId: existingJob.id,
        requestId: existingJob.request_id,
        providerId: existingJob.provider_id,
        customerId: existingJob.customer_id,
        cancelledBy: userId,
      },
    });

    // Notify both parties — queue if workers enabled, else inline
    if (this.workersEnabled) {
      this.notificationQueue
        .add('notify-job-cancelled', {
          customerId: existingJob.customer_id,
          providerId: existingJob.provider_id,
          jobId: existingJob.id,
          cancelledBy: userId,
        })
        .catch((err: any) => {
          this.logger.warn(
            `Failed to enqueue job cancellation notification: ${err.message}`,
            JobService.name,
          );
        });
    } else {
      Promise.all([
        this.userClient.getUserEmail(existingJob.customer_id),
        this.userClient.getUserEmail(existingJob.provider_id),
      ]).then(([customerEmail, providerEmail]) => {
        if (customerEmail) {
          this.notificationClient.sendEmail({
            to: customerEmail,
            template: 'ORDER_CANCELLED',
            variables: {
              username: customerEmail.split('@')[0],
              orderId: existingJob.id,
              cancelledBy: userId,
              reason: 'Job cancelled',
            },
          });
        }
        if (providerEmail) {
          this.notificationClient.sendEmail({
            to: providerEmail,
            template: 'ORDER_CANCELLED',
            variables: {
              username: providerEmail.split('@')[0],
              orderId: existingJob.id,
              cancelledBy: userId,
              reason: 'Job cancelled',
            },
          });
        }
      }).catch((err: any) => {
        this.logger.warn(
          `Failed to send job cancellation email: ${err.message}`,
          JobService.name,
        );
      });
    }

    // Track analytics
    this.analyticsClient.track({
      userId: userId,
      action: "job_cancelled",
      resource: "job",
      resourceId: existingJob.id,
      metadata: {
        providerId: existingJob.provider_id,
        requestId: existingJob.request_id,
        cancelledBy: userId,
      },
    });
  }
}
