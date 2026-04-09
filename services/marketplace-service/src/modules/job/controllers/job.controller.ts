import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  BadRequestException,
  Request,
  UploadedFiles,
  UseInterceptors,
} from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import { FlexibleIdPipe } from "@/common/pipes/flexible-id.pipe";
import { StrictUuidPipe } from "@/common/pipes/strict-uuid.pipe";
import { JobService } from "../services/job.service";
import { CreateJobDto } from "../dto/create-job.dto";
import { UpdateJobStatusDto } from "../dto/update-job-status.dto";
import {
  JobResponseDto,
  PaginatedJobResponseDto,
} from "../dto/job-response.dto";
import { JobQueryDto } from "../dto/job-query.dto";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { ForbiddenException } from "../../../common/exceptions/http.exceptions";
import { FileServiceClient } from "../../../common/file-service.client";
import "multer";

@UseGuards(JwtAuthGuard)
@Controller("jobs")
export class JobController {
  constructor(
    private readonly jobService: JobService,
    private readonly fileServiceClient: FileServiceClient,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createJob(
    @Body() createJobDto: CreateJobDto,
    @Request() req: any,
  ): Promise<JobResponseDto> {
    // Override customer_id with the authenticated user's ID
    createJobDto.customer_id = req.user.userId;
    return this.jobService.createJob(createJobDto);
  }

  @Get("stats")
  @HttpCode(HttpStatus.OK)
  async getJobStats() {
    return this.jobService.getJobStats();
  }

  @Get("my")
  @HttpCode(HttpStatus.OK)
  async getMyJobs(@Request() req: any): Promise<{
    data: JobResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const userId = req.user.userId;
    // Get jobs where user is either customer or provider
    const customerJobs = await this.jobService.getJobsByCustomer(userId);
    const providerJobs = await this.jobService.getJobsByProviderUser(userId);
    const merged = [...customerJobs.data, ...providerJobs.data];
    const data = Array.from(
      new Map(merged.map((job) => [job.id, job])).values(),
    );
    return { data, total: data.length, page: 1, limit: data.length || 1 };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async getJobs(
    @Query() queryDto: JobQueryDto,
  ): Promise<PaginatedJobResponseDto> {
    return this.jobService.getJobs(queryDto);
  }

  @Get(":id")
  @HttpCode(HttpStatus.OK)
  async getJobById(
    @Param("id", FlexibleIdPipe) id: string,
  ): Promise<JobResponseDto> {
    return this.jobService.getJobById(id);
  }

  @Patch(":id/status")
  @HttpCode(HttpStatus.OK)
  async updateJobStatus(
    @Param("id", StrictUuidPipe) id: string,
    @Body() updateJobStatusDto: UpdateJobStatusDto,
    @Request() req: any,
  ): Promise<JobResponseDto> {
    return this.jobService.updateJobStatus(
      id,
      updateJobStatusDto,
      req.user.userId,
      req.user.role,
    );
  }

  @Post(":id/complete")
  @HttpCode(HttpStatus.OK)
  async completeJob(
    @Param("id", StrictUuidPipe) id: string,
    @Request() req: any,
  ): Promise<JobResponseDto> {
    return this.jobService.completeJob(id, req.user.userId, req.user.role);
  }

  // Authenticated — provider or customer can upload completion photos for jobs
  @Post(":id/photos")
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FilesInterceptor("files", 10))
  async uploadJobPhotos(
    @Param("id", StrictUuidPipe) jobId: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req: any,
  ): Promise<{
    success: boolean;
    message: string;
    data: {
      jobId: string;
      uploadedFiles: any[];
    };
  }> {
    if (!files || files.length === 0) {
      throw new BadRequestException("No files provided");
    }

    // Verify job exists and user is either provider or customer
    const job = await this.jobService.getJobById(jobId);
    const isProvider = job.provider_id === req.user.userId;
    const isCustomer = job.customer_id === req.user.userId;
    const isAdmin = req.user.role === "admin";

    if (!isProvider && !isCustomer && !isAdmin) {
      throw new ForbiddenException(
        "You can only upload photos for jobs you are involved in",
      );
    }

    // Upload files to external file service
    const uploadedFiles = await this.fileServiceClient.uploadMultipleFiles(
      files,
      {
        category: "job-photo",
        linkedEntityId: jobId,
        linkedEntityType: "job",
      },
      req.user.userId,
      req.user.role
    );

    return {
      success: true,
      message: `${uploadedFiles.length} photo(s) uploaded successfully for job`,
      data: {
        jobId,
        uploadedFiles,
      },
    };
  }

  @Get("provider/:providerId")
  @HttpCode(HttpStatus.OK)
  async getJobsByProvider(
    @Param("providerId", FlexibleIdPipe) providerId: string,
  ): Promise<{
    data: JobResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const result = await this.jobService.getJobsByProvider(providerId);
    return { ...result, page: 1, limit: result.data.length || 1 };
  }

  @Get("status/:status")
  @HttpCode(HttpStatus.OK)
  async getJobsByStatus(@Param("status") status: string): Promise<{
    data: JobResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const result = await this.jobService.getJobsByStatus(status);
    return { ...result, page: 1, limit: result.data.length || 1 };
  }
}
