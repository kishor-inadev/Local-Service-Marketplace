import {
	Controller,
	Get,
	Post,
	Patch,
	Delete,
	Body,
	Param,
	Query,
	Inject,
	LoggerService,
	HttpCode,
	HttpStatus,
	UseGuards,
} from "@nestjs/common";
import { FlexibleIdPipe } from "@/common/pipes/flexible-id.pipe";
import { StrictUuidPipe } from "@/common/pipes/strict-uuid.pipe";
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionsGuard as RolesGuard, Roles, RequirePermissions } from '@/common/rbac';
import { BackgroundJobService } from "../services/background-job.service";
import { CreateBackgroundJobDto } from "../dto/create-background-job.dto";
import { UpdateJobStatusDto } from "../dto/update-job-status.dto";
import { BackgroundJobQueryDto } from "../dto/background-job-query.dto";

@UseGuards(JwtAuthGuard, RolesGuard)
@RequirePermissions('admin.access')
@Controller("background-jobs")
export class BackgroundJobController {
	constructor(
		@Inject(WINSTON_MODULE_NEST_PROVIDER)
		private readonly logger: LoggerService,
		private readonly backgroundJobService: BackgroundJobService,
	) {}

	@Post()
	async createJob(@Body() createJobDto: CreateBackgroundJobDto) {
		this.logger.log(`POST /background-jobs - Create job: ${createJobDto.jobType}`, "BackgroundJobController");

		const job = await this.backgroundJobService.createJob(createJobDto);

		return job;
	}

	@Get()
	async getAllJobs(@Query() queryDto: BackgroundJobQueryDto) {
		this.logger.log("GET /background-jobs - Retrieve all jobs", "BackgroundJobController");

		return this.backgroundJobService.getAllJobs(queryDto);
	}

	@Get("status/:status")
	async getJobsByStatus(@Param("status") status: string) {
		this.logger.log(`GET /background-jobs/status/${status} - Retrieve jobs by status`, "BackgroundJobController");

		return this.backgroundJobService.getJobsByStatus(status);
	}

	@Get("stats")
	async getQueueStats() {
		this.logger.log("GET /background-jobs/stats - Retrieve queue statistics", "BackgroundJobController");

		const stats = await this.backgroundJobService.getQueueStats();

		return stats;
	}

	@Get(":id")
	async getJobById(@Param("id", FlexibleIdPipe) id: string) {
		this.logger.log(`GET /background-jobs/${id} - Retrieve job by ID`, "BackgroundJobController");

		const job = await this.backgroundJobService.getJobById(id);

		return job;
	}

	@Patch(":id/status")
	@HttpCode(HttpStatus.OK)
	async updateJobStatus(@Param("id", StrictUuidPipe) id: string, @Body() updateJobStatusDto: UpdateJobStatusDto) {
		this.logger.log(`PATCH /background-jobs/${id}/status - Update job status`, "BackgroundJobController");

		const job = await this.backgroundJobService.updateJobStatus(id, updateJobStatusDto.status);

		return job;
	}

	@Delete(":id")
	@HttpCode(HttpStatus.OK)
	async deleteJob(@Param("id", StrictUuidPipe) id: string) {
		this.logger.log(`DELETE /background-jobs/${id} - Delete job`, "BackgroundJobController");

		await this.backgroundJobService.deleteJob(id);

		return { message: "Background job deleted successfully" };
	}
}
