import { IsString, IsEnum } from 'class-validator';

export enum JobStatus {
	PENDING = "pending",
	SCHEDULED = "scheduled",
	IN_PROGRESS = "in_progress",
	COMPLETED = "completed",
	CANCELLED = "cancelled",
	DISPUTED = "disputed",
}

export class UpdateJobStatusDto {
  @IsString()
  @IsEnum(JobStatus)
  status: JobStatus;
}
