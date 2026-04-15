import { IsOptional, IsInt, Min, Max, IsEnum, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export enum ReviewSortBy {
  CREATED_AT = 'created_at',
  RATING = 'rating',
  HELPFUL_COUNT = 'helpful_count',
}

export enum ReviewSortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class ReviewQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  min_rating?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  max_rating?: number;

  @IsOptional()
  @IsEnum(ReviewSortBy)
  sortBy?: ReviewSortBy = ReviewSortBy.CREATED_AT;

  @IsOptional()
  @IsEnum(ReviewSortOrder)
  sortOrder?: ReviewSortOrder = ReviewSortOrder.DESC;
}
