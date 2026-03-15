import { IsOptional, IsInt, Min, Max, IsString, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class TransactionQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @IsIn(['pending', 'completed', 'failed', 'refunded'])
  status?: string;
}

export class TransactionDto {
  id: string;
  job_id: string;
  customer_id: string;
  provider_amount: number;
  platform_fee: number;
  total_amount: number;
  status: string;
  payment_method: string;
  transaction_id: string;
  currency: string;
  created_at: Date;
  paid_at?: Date;
  customer_name?: string;
}

export class PaginatedTransactionResponseDto {
  data: TransactionDto[];
  total: number;
  cursor?: string;
}
