import { IsOptional, IsString, IsNumber, Min, Max, IsEnum, IsDateString, IsUUID } from "class-validator";
import { Type } from "class-transformer";

export enum JobSortBy {
	STARTED_AT = "started_at",
	COMPLETED_AT = "completed_at",
	CREATED_AT = "created_at",
}

export enum SortOrder {
	ASC = "asc",
	DESC = "desc",
}

export class JobQueryDto {
	@IsOptional()
	@IsUUID()
	provider_id?: string;

	@IsOptional()
	@IsUUID()
	customer_id?: string;

	@IsOptional()
	@IsUUID()
	request_id?: string;

	@IsOptional()
	@IsString()
	status?: string;

	@IsOptional()
	@IsDateString()
	started_from?: string;

	@IsOptional()
	@IsDateString()
	started_to?: string;

	@IsOptional()
	@IsDateString()
	completed_from?: string;

	@IsOptional()
	@IsDateString()
	completed_to?: string;

	@IsOptional()
	@IsNumber()
	@Type(() => Number)
	@Min(1)
	@Max(100)
	limit?: number = 20;

	@IsOptional()
	@IsNumber()
	@Type(() => Number)
	@Min(1)
	page?: number;

	@IsOptional()
	@IsString()
	cursor?: string;

	@IsOptional()
	@IsEnum(JobSortBy)
	sortBy?: JobSortBy = JobSortBy.STARTED_AT;

	@IsOptional()
	@IsEnum(SortOrder)
	sortOrder?: SortOrder = SortOrder.DESC;
}
