import { IsString, IsEnum } from 'class-validator';

export enum JobStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export class UpdateJobStatusDto {
  @IsString()
  @IsEnum(JobStatus)
  status: JobStatus;
}
