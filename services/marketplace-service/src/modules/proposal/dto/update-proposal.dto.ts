import { IsNumber, IsString, IsOptional, Min } from 'class-validator';

export class UpdateProposalDto {
  @IsNumber()
  @IsOptional()
  @Min(0)
  price?: number;

  @IsString()
  @IsOptional()
  message?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  estimated_hours?: number;
}
