import { IsDateString } from 'class-validator';

export class BackfillMetricsDto {
  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}
