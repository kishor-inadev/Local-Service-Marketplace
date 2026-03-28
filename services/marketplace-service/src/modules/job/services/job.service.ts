import { Injectable, Inject, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { JobRepository } from '../repositories/job.repository';
import { CreateJobDto } from '../dto/create-job.dto';
import { UpdateJobStatusDto, JobStatus } from '../dto/update-job-status.dto';
import { JobResponseDto, PaginatedJobResponseDto } from "../dto/job-response.dto";
import { JobQueryDto, JobSortBy, SortOrder } from "../dto/job-query.dto";
import { NotFoundException, BadRequestException, ConflictException } from '../../../common/exceptions/http.exceptions';
import { validateCursorMode, validateDateRange } from "../../../common/pagination/list-query-validation.util";
import { KafkaService } from '../../../kafka/kafka.service';
import { RedisService } from '../../../redis/redis.service';
import { NotificationClient } from '../../../common/notification/notification.client';
import { UserClient } from '../../../common/user/user.client';

@Injectable()
export class JobService {
	private readonly JOB_CACHE_TTL = 180; // 3 minutes (jobs change status frequently)

	constructor(
		private readonly jobRepository: JobRepository,
		private readonly kafkaService: KafkaService,
		private readonly redisService: RedisService,
		private readonly notificationClient: NotificationClient,
		private readonly userClient: UserClient,
		@Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
	) {}

	async createJob(dto: CreateJobDto): Promise<JobResponseDto> {
		this.logger.log(`Creating job for request ${dto.request_id} with provider ${dto.provider_id}`, JobService.name);

		// Check if job already exists for this request
		const existingJob = await this.jobRepository.getJobByRequestId(dto.request_id);
		if (existingJob) {
			throw new ConflictException("Job already exists for this request");
		}

		const job = await this.jobRepository.createJob(dto);

		this.logger.log(`Job created successfully: ${job.id}`, JobService.name);

		// Send notification to provider (job assigned)
		const providerEmail = await this.userClient.getProviderEmail(dto.provider_id);
		const customerName = "Customer"; // TODO: Fetch from request or user-service

		if (providerEmail) {
			this.notificationClient
				.sendEmail({
					to: providerEmail,
					template: "jobAssigned",
					variables: {
						customerName,
						serviceName: "Service Request",
						jobId: job.id,
						jobUrl: `${process.env.FRONTEND_URL || "http://localhost:3000"}/jobs/${job.id}`,
					},
				})
				.catch((err) => {
					this.logger.warn(`Failed to send job creation notification: ${err.message}`, JobService.name);
				});
		}

		// Publish event to Kafka if enabled
		await this.kafkaService.publishEvent("job-events", {
			eventType: "job_created",
			eventId: `${job.id}-${Date.now()}`,
			timestamp: new Date().toISOString(),
			data: { jobId: job.id, requestId: job.request_id, providerId: job.provider_id, status: job.status },
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
			await this.redisService.set(cacheKey, JSON.stringify(response), this.JOB_CACHE_TTL);
		}

		return response;
	}

	async updateJobStatus(id: string, dto: UpdateJobStatusDto): Promise<JobResponseDto> {
		this.logger.log(`Updating job status: ${id} to ${dto.status}`, JobService.name);

		// Validate job exists
		const existingJob = await this.jobRepository.getJobById(id);
		if (!existingJob) {
			throw new NotFoundException("Job not found");
		}

		// Validate status transition
		if (existingJob.status === "completed") {
			throw new BadRequestException("Cannot update status of completed job");
		}

		if (existingJob.status === "cancelled") {
			throw new BadRequestException("Cannot update status of cancelled job");
		}

		const job = await this.jobRepository.updateJobStatus(id, dto.status);

		this.logger.log(`Job status updated successfully: ${id}`, JobService.name);

		// Invalidate cache
		if (this.redisService.isCacheEnabled()) {
			await this.redisService.del(`job:${id}`);
		}

		// Publish event to Kafka if enabled
		await this.kafkaService.publishEvent("job-events", {
			eventType: dto.status === "in_progress" ? "job_started" : `job_${dto.status}`,
			eventId: `${job.id}-${Date.now()}`,
			timestamp: new Date().toISOString(),
			data: { jobId: job.id, requestId: job.request_id, providerId: job.provider_id, status: job.status },
		});

		return JobResponseDto.fromEntity(job);
	}

	async completeJob(id: string): Promise<JobResponseDto> {
		this.logger.log(`Completing job: ${id}`, JobService.name);

		// Validate job exists
		const existingJob = await this.jobRepository.getJobById(id);
		if (!existingJob) {
			throw new NotFoundException("Job not found");
		}

		// Validate job is in progress
		if (existingJob.status === "completed") {
			throw new BadRequestException("Job is already completed");
		}

		if (existingJob.status === "cancelled") {
			throw new BadRequestException("Cannot complete a cancelled job");
		}

		const job = await this.jobRepository.completeJob(id);

		this.logger.log(`Job completed successfully: ${id}`, JobService.name);

		// Invalidate cache
		if (this.redisService.isCacheEnabled()) {
			await this.redisService.del(`job:${id}`);
		}

		// Publish event to Kafka if enabled
		await this.kafkaService.publishEvent("job-events", {
			eventType: "job_completed",
			eventId: `${job.id}-${Date.now()}`,
			timestamp: new Date().toISOString(),
			data: { jobId: job.id, requestId: job.request_id, providerId: job.provider_id, status: job.status },
		});

		return JobResponseDto.fromEntity(job);
	}

	async getJobsByProvider(providerId: string): Promise<{ data: JobResponseDto[]; total: number }> {
		this.logger.log(`Fetching jobs for provider: ${providerId}`, JobService.name);

		const jobs = await this.jobRepository.getJobsByProvider(providerId);
		const data = jobs.map(JobResponseDto.fromEntity);

		return { data, total: data.length };
	}

	async getJobsByStatus(status: string): Promise<{ data: JobResponseDto[]; total: number }> {
		this.logger.log(`Fetching jobs with status: ${status}`, JobService.name);

		const jobs = await this.jobRepository.getJobsByStatus(status);
		const data = jobs.map(JobResponseDto.fromEntity);

		return { data, total: data.length };
	}

	async getJobsByCustomer(userId: string): Promise<{ data: JobResponseDto[]; total: number }> {
		this.logger.log(`Fetching jobs for customer: ${userId}`, JobService.name);

		const jobs = await this.jobRepository.getJobsByCustomer(userId);
		const data = jobs.map(JobResponseDto.fromEntity);

		return { data, total: data.length };
	}

	async getJobsByProviderUser(userId: string): Promise<{ data: JobResponseDto[]; total: number }> {
		this.logger.log(`Fetching jobs for provider user: ${userId}`, JobService.name);

		const jobs = await this.jobRepository.getJobsByProviderUser(userId);
		const data = jobs.map(JobResponseDto.fromEntity);

		return { data, total: data.length };
	}

	async getJobs(queryDto: JobQueryDto): Promise<PaginatedJobResponseDto> {
		this.logger.log(`Fetching jobs with filters: ${JSON.stringify(queryDto)}`, JobService.name);

		validateDateRange(queryDto.started_from, queryDto.started_to, "started_from", "started_to");
		validateDateRange(queryDto.completed_from, queryDto.completed_to, "completed_from", "completed_to");
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
			return new PaginatedJobResponseDto(response, nextCursor, hasMore);
		}

		const [jobs, total] = await Promise.all([
			this.jobRepository.getJobsPaginated(queryDto),
			this.jobRepository.countJobs(queryDto),
		]);
		const response = jobs.map(JobResponseDto.fromEntity);
		return new PaginatedJobResponseDto(response, undefined, false, total);
	}
}
