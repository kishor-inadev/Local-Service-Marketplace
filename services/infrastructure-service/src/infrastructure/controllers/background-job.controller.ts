import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Inject, LoggerService, HttpCode, HttpStatus } from "@nestjs/common";
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { BackgroundJobService } from '../services/background-job.service';
import { CreateBackgroundJobDto } from '../dto/create-background-job.dto';
import { UpdateJobStatusDto } from '../dto/update-job-status.dto';

@Controller('background-jobs')
export class BackgroundJobController {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly backgroundJobService: BackgroundJobService,
  ) {}

  @Post()
  async createJob(@Body() createJobDto: CreateBackgroundJobDto) {
    this.logger.log(
      `POST /background-jobs - Create job: ${createJobDto.jobType}`,
      'BackgroundJobController',
    );

    const job = await this.backgroundJobService.createJob(createJobDto);

    return job;
  }

  @Get()
  async getAllJobs(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    this.logger.log(
      'GET /background-jobs - Retrieve all jobs',
      'BackgroundJobController',
    );

    const parsedLimit = limit ? parseInt(limit) : 100;
    const parsedOffset = offset ? parseInt(offset) : 0;

    const result = await this.backgroundJobService.getAllJobs(
      parsedLimit,
      parsedOffset,
    );

    return { data: result.data, total: result.total };
  }

  @Get('status/:status')
  async getJobsByStatus(@Param('status') status: string) {
    this.logger.log(
      `GET /background-jobs/status/${status} - Retrieve jobs by status`,
      'BackgroundJobController',
    );

    const data = await this.backgroundJobService.getJobsByStatus(status);

    return data;
  }

  @Get('stats')
  async getQueueStats() {
    this.logger.log(
      'GET /background-jobs/stats - Retrieve queue statistics',
      'BackgroundJobController',
    );

    const stats = await this.backgroundJobService.getQueueStats();

    return stats;
  }

  @Get(':id')
  async getJobById(@Param('id') id: string) {
    this.logger.log(
      `GET /background-jobs/${id} - Retrieve job by ID`,
      'BackgroundJobController',
    );

    const job = await this.backgroundJobService.getJobById(id);

    return job;
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  async updateJobStatus(
    @Param('id') id: string,
    @Body() updateJobStatusDto: UpdateJobStatusDto,
  ) {
    this.logger.log(
      `PATCH /background-jobs/${id}/status - Update job status`,
      'BackgroundJobController',
    );

    const job = await this.backgroundJobService.updateJobStatus(
      id,
      updateJobStatusDto.status,
    );

    return job;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteJob(@Param('id') id: string) {
    this.logger.log(
      `DELETE /background-jobs/${id} - Delete job`,
      'BackgroundJobController',
    );

    await this.backgroundJobService.deleteJob(id);

    return { result: "Background job deleted successfully" };
  }
}
