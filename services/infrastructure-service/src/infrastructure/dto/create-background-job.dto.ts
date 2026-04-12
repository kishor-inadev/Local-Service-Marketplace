import { IsNotEmpty, IsOptional, IsObject, IsEnum } from 'class-validator';

export enum BackgroundJobType {
  SEND_EMAIL = 'send-email',
  CLEANUP_EXPIRED_DATA = 'cleanup-expired-data',
  RECALCULATE_METRICS = 'recalculate-metrics',
}

export class CreateBackgroundJobDto {
  @IsNotEmpty()
  @IsEnum(BackgroundJobType)
  jobType: BackgroundJobType;

  @IsOptional()
  @IsObject()
  payload?: any;
}
