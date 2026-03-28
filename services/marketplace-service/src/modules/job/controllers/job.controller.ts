import { Controller, Post, Get, Patch, Body, Param, Query, HttpCode, HttpStatus, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { JobService } from '../services/job.service';
import { CreateJobDto } from '../dto/create-job.dto';
import { UpdateJobStatusDto } from '../dto/update-job-status.dto';
import { JobResponseDto, PaginatedJobResponseDto } from "../dto/job-response.dto";
import { JobQueryDto } from "../dto/job-query.dto";
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller("jobs")
export class JobController {
	constructor(private readonly jobService: JobService) {}

	@Post()
	@HttpCode(HttpStatus.CREATED)
	async createJob(@Body() createJobDto: CreateJobDto): Promise<JobResponseDto> {
		return this.jobService.createJob(createJobDto);
	}

	@Get("my")
	@HttpCode(HttpStatus.OK)
	async getMyJobs(
		@Query("user_id", ParseUUIDPipe) userId: string,
	): Promise<{ data: JobResponseDto[]; total: number; page: number; limit: number }> {
		if (!userId) {
			throw new Error("User ID is required");
		}
		// Get jobs where user is either customer or provider
		const customerJobs = await this.jobService.getJobsByCustomer(userId);
		const providerJobs = await this.jobService.getJobsByProviderUser(userId);
		const merged = [...customerJobs.data, ...providerJobs.data];
		const data = Array.from(new Map(merged.map((job) => [job.id, job])).values());
		return { data, total: data.length, page: 1, limit: data.length || 1 };
	}

	@Get()
	@HttpCode(HttpStatus.OK)
	async getJobs(@Query() queryDto: JobQueryDto): Promise<PaginatedJobResponseDto> {
		return this.jobService.getJobs(queryDto);
	}

	@Get(":id([0-9a-fA-F-]{36})")
	@HttpCode(HttpStatus.OK)
	async getJobById(@Param("id", ParseUUIDPipe) id: string): Promise<JobResponseDto> {
		return this.jobService.getJobById(id);
	}

	@Patch(":id([0-9a-fA-F-]{36})/status")
	@HttpCode(HttpStatus.OK)
	async updateJobStatus(
		@Param("id", ParseUUIDPipe) id: string,
		@Body() updateJobStatusDto: UpdateJobStatusDto,
	): Promise<JobResponseDto> {
		return this.jobService.updateJobStatus(id, updateJobStatusDto);
	}

	@Post(":id([0-9a-fA-F-]{36})/complete")
	@HttpCode(HttpStatus.OK)
	async completeJob(@Param("id", ParseUUIDPipe) id: string): Promise<JobResponseDto> {
		return this.jobService.completeJob(id);
	}

	@Get("provider/:providerId")
	@HttpCode(HttpStatus.OK)
	async getJobsByProvider(
		@Param("providerId", ParseUUIDPipe) providerId: string,
	): Promise<{ data: JobResponseDto[]; total: number; page: number; limit: number }> {
		const result = await this.jobService.getJobsByProvider(providerId);
		return { ...result, page: 1, limit: result.data.length || 1 };
	}

	@Get("status/:status")
	@HttpCode(HttpStatus.OK)
	async getJobsByStatus(
		@Param("status") status: string,
	): Promise<{ data: JobResponseDto[]; total: number; page: number; limit: number }> {
		const result = await this.jobService.getJobsByStatus(status);
		return { ...result, page: 1, limit: result.data.length || 1 };
	}
}
