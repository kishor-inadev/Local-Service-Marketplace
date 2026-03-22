import { IsString, IsNumber, IsUUID, MinLength, Min, IsOptional, IsDateString } from 'class-validator';

export class CreateProposalDto {
  @IsUUID()
  request_id: string;

  @IsUUID()
  provider_id: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsString()
  @MinLength(10)
  message: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  estimated_hours?: number;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  completion_date?: string;
}
