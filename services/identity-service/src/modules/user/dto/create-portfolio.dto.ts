import { IsString, IsOptional, IsUrl, IsNumber, IsUUID, MinLength } from 'class-validator';

export class CreatePortfolioDto {
  @IsUUID()
  provider_id: string;

  @IsString()
  @MinLength(3)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsUrl()
  image_url: string;

  @IsOptional()
  @IsNumber()
  display_order?: number;
}
