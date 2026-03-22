import { IsUUID, IsOptional, IsNumber, Min } from 'class-validator';

export class CreateJobDto {
  @IsUUID()
  request_id: string;

  @IsUUID()
  provider_id: string;

  @IsUUID()
  customer_id: string;

  @IsOptional()
  @IsUUID()
  proposal_id?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  actual_amount?: number;
}
