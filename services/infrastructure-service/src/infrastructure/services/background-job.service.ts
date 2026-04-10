import { Injectable, Inject, LoggerService } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { BackgroundJobRepository } from '../repositories/background-job.repository';
import { CreateBackgroundJobDto } from '../dto/create-background-job.dto';
import { BackgroundJob } from '../entities/background-job.entity';
import { BackgroundJobQueryDto } from "../dto/background-job-query.dto";
import {
	resolvePagination,
	validateDateRange,
	validateMinMaxRange,
} from "../../common/pagination/list-query-validation.util";

@Injectable()
export class BackgroundJobService {
	constructor(
		@Inject(WINSTON_MODULE_NEST_PROVIDER)
		private readonly logger: LoggerService,
		private readonly backgroundJobRepository: BackgroundJobRepository,
		@InjectQueue('infra.background-jobs') private readonly jobQueue: Queue,
	) {}

	async createJob(createJobDto: CreateBackgroundJobDto): Promise<BackgroundJob> {
		try {
			// Create job record in database
			const job = await this.backgroundJobRepository.createJob(createJobDto);

			// Enqueue via BullMQ (replaces redisService.addJob)
			await this.jobQueue.add(
				createJobDto.jobType,
				{ jobId: job.id, ...createJobDto.payload },
			);

			this.logger.log(`Background job created: ${createJobDto.jobType} (ID: ${job.id})`, "BackgroundJobService");

			return job;
		} catch (error) {
			this.logger.error(`Failed to create background job: ${error.message}`, error.stack, "BackgroundJobService");
			throw error;
		}
	}

	async getJobById(id: string): Promise<BackgroundJob | null> {
		try {
			const job = await this.backgroundJobRepository.getJobById(id);

			this.logger.log(`Retrieved background job by ID: ${id}`, "BackgroundJobService");

			return job;
		} catch (error) {
			this.logger.error(`Failed to get background job: ${error.message}`, error.stack, "BackgroundJobService");
			throw error;
		}
	}

	async getAllJobs(
		queryDto: BackgroundJobQueryDto,
	): Promise<{ data: BackgroundJob[]; total: number; page: number; limit: number }> {
		try {
			validateDateRange(queryDto.createdFrom, queryDto.createdTo, "createdAt");
			validateDateRange(queryDto.scheduledFrom, queryDto.scheduledTo, "scheduledFor");
			validateMinMaxRange(queryDto.minAttempts, queryDto.maxAttempts, "attempts");
			const pagination = resolvePagination(queryDto, { page: 1, limit: 100 });
			const [data, total] = await Promise.all([
				this.backgroundJobRepository.findJobs(queryDto, pagination),
				this.backgroundJobRepository.countJobs(queryDto),
			]);

			this.logger.log(`Retrieved ${data.length} background jobs`, "BackgroundJobService");

			return { data, total, page: pagination.page, limit: pagination.limit };
		} catch (error) {
			this.logger.error(`Failed to get all jobs: ${error.message}`, error.stack, "BackgroundJobService");
			throw error;
		}
	}

	async getJobsByStatus(
		status: string,
	): Promise<{ data: BackgroundJob[]; total: number; page: number; limit: number }> {
		return this.getAllJobs({ status: status as any, page: 1, limit: 100 });
	}

	async updateJobStatus(id: string, status: string): Promise<BackgroundJob | null> {
		try {
			const job = await this.backgroundJobRepository.updateJobStatus(id, status);

			this.logger.log(`Updated job ${id} status to: ${status}`, "BackgroundJobService");

			return job;
		} catch (error) {
			this.logger.error(`Failed to update job status: ${error.message}`, error.stack, "BackgroundJobService");
			throw error;
		}
	}

	async incrementJobAttempts(id: string): Promise<BackgroundJob | null> {
		try {
			const job = await this.backgroundJobRepository.incrementJobAttempts(id);

			this.logger.log(`Incremented attempts for job: ${id}`, "BackgroundJobService");

			return job;
		} catch (error) {
			this.logger.error(`Failed to increment job attempts: ${error.message}`, error.stack, "BackgroundJobService");
			throw error;
		}
	}

	async deleteJob(id: string): Promise<void> {
		try {
			await this.backgroundJobRepository.deleteJob(id);

			this.logger.log(`Deleted background job: ${id}`, "BackgroundJobService");
		} catch (error) {
			this.logger.error(`Failed to delete job: ${error.message}`, error.stack, "BackgroundJobService");
			throw error;
		}
	}

	async getQueueStats(): Promise<any> {
		try {
			const counts = await this.redisService.getJobCounts("background-jobs");

			this.logger.log("Retrieved queue statistics", "BackgroundJobService");

			return counts;
		} catch (error) {
			this.logger.error(`Failed to get queue stats: ${error.message}`, error.stack, "BackgroundJobService");
			throw error;
		}
	}
}
