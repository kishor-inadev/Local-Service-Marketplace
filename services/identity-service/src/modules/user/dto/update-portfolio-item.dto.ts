import { IsString, IsOptional } from 'class-validator';

export class UpdatePortfolioItemDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
