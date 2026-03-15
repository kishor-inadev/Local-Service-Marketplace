import { IsOptional, IsString, IsDateString } from 'class-validator';

export class ProviderEarningsQueryDto {
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;
}

export class ProviderEarningsSummary {
  total_earnings: number;
  total_paid: number;
  pending_payout: number;
  completed_count: number;
  currency: string;
}

export class MonthlyEarnings {
  month: string;
  earnings: number;
  job_count: number;
}

export class ProviderEarningsResponseDto {
  summary: ProviderEarningsSummary;
  monthly: MonthlyEarnings[];
  average_per_job: number;
}
