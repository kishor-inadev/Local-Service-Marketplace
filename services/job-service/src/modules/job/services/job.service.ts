import { Injectable, Inject, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { JobRepository } from '../repositories/job.repository';
import { CreateJobDto } from '../dto/create-job.dto';
import { UpdateJobStatusDto, JobStatus } from '../dto/update-job-status.dto';
import { JobResponseDto } from '../dto/job-response.dto';
import { NotFoundException, BadRequestException, ConflictException } from '../../../common/exceptions/http.exceptions';
import { KafkaService } from '../../../kafka/kafka.service';
import { RedisService } from '../../../redis/redis.service';

@Injectable()
export class JobService {
  private readonly JOB_CACHE_TTL = 180; // 3 minutes (jobs change status frequently)

  constructor(
    private readonly jobRepository: JobRepository,
    private readonly kafkaService: KafkaService,
    private readonly redisService: RedisService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
  ) {}

  async createJob(dto: CreateJobDto): Promise<JobResponseDto> {
    this.logger.log(`Creating job for request ${dto.request_id} with provider ${dto.provider_id}`, JobService.name);

    // Check if job already exists for this request
    const existingJob = await this.jobRepository.getJobByRequestId(dto.request_id);
    if (existingJob) {
      throw new ConflictException('Job already exists for this request');
    }

    const job = await this.jobRepository.createJob(dto);

    this.logger.log(`Job created successfully: ${job.id}`, JobService.name);

    // Publish event to Kafka if enabled
    await this.kafkaService.publishEvent('job-events', {
      eventType: 'job_created',
      eventId: `${job.id}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        jobId: job.id,
        requestId: job.request_id,
        providerId: job.provider_id,
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
      throw new NotFoundException('Job not found');
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
      throw new NotFoundException('Job not found');
    }

    // Validate status transition
    if (existingJob.status === 'completed') {
      throw new BadRequestException('Cannot update status of completed job');
    }

    if (existingJob.status === 'cancelled') {
      throw new BadRequestException('Cannot update status of cancelled job');
    }

    const job = await this.jobRepository.updateJobStatus(id, dto.status);

    this.logger.log(`Job status updated successfully: ${id}`, JobService.name);

    // Invalidate cache
    if (this.redisService.isCacheEnabled()) {
      await this.redisService.del(`job:${id}`);
    }

    // Publish event to Kafka if enabled
    await this.kafkaService.publishEvent('job-events', {
      eventType: dto.status === 'in_progress' ? 'job_started' : `job_${dto.status}`,
      eventId: `${job.id}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        jobId: job.id,
        requestId: job.request_id,
        providerId: job.provider_id,
        status: job.status,
      },
    });

    return JobResponseDto.fromEntity(job);
  }

  async completeJob(id: string): Promise<JobResponseDto> {
    this.logger.log(`Completing job: ${id}`, JobService.name);

    // Validate job exists
    const existingJob = await this.jobRepository.getJobById(id);
    if (!existingJob) {
      throw new NotFoundException('Job not found');
    }

    // Validate job is in progress
    if (existingJob.status === 'completed') {
      throw new BadRequestException('Job is already completed');
    }

    if (existingJob.status === 'cancelled') {
      throw new BadRequestException('Cannot complete a cancelled job');
    }

    const job = await this.jobRepository.completeJob(id);

    this.logger.log(`Job completed successfully: ${id}`, JobService.name);

    // Invalidate cache
    if (this.redisService.isCacheEnabled()) {
      await this.redisService.del(`job:${id}`);
    }

    // Publish event to Kafka if enabled
    await this.kafkaService.publishEvent('job-events', {
      eventType: 'job_completed',
      eventId: `${job.id}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        jobId: job.id,
        requestId: job.request_id,
        providerId: job.provider_id,
        status: job.status,
      },
    });

    return JobResponseDto.fromEntity(job);
  }

  async getJobsByProvider(providerId: string): Promise<JobResponseDto[]> {
    this.logger.log(`Fetching jobs for provider: ${providerId}`, JobService.name);

    const jobs = await this.jobRepository.getJobsByProvider(providerId);

    return jobs.map(JobResponseDto.fromEntity);
  }

  async getJobsByStatus(status: string): Promise<JobResponseDto[]> {
    this.logger.log(`Fetching jobs with status: ${status}`, JobService.name);

    const jobs = await this.jobRepository.getJobsByStatus(status);

    return jobs.map(JobResponseDto.fromEntity);
  }
}
