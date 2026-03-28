import { IsOptional, IsString, IsNumber, IsEnum, Min, Max } from "class-validator";
import { Type } from "class-transformer";

export enum ProviderSortBy {
	CREATED_AT = "created_at",
	RATING = "rating",
	BUSINESS_NAME = "business_name",
	TOTAL_JOBS_COMPLETED = "total_jobs_completed",
}

export enum SortOrder {
	ASC = "asc",
	DESC = "desc",
}

export enum ProviderVerificationStatus {
	PENDING = "pending",
	VERIFIED = "verified",
	REJECTED = "rejected",
}

export class ProviderQueryDto {
	@IsOptional()
	@IsNumber()
	@Min(1)
	@Max(100)
	@Type(() => Number)
	limit?: number = 20;

	@IsOptional()
	@IsNumber()
	@Min(1)
	@Max(1000)
	@Type(() => Number)
	page?: number;

	@IsOptional()
	@IsString()
	cursor?: string;

	@IsOptional()
	@IsString()
	category_id?: string;

	@IsOptional()
	@IsString()
	search?: string;

	@IsOptional()
	@IsString()
	location_id?: string;

	@IsOptional()
	@IsEnum(ProviderSortBy)
	sortBy?: ProviderSortBy = ProviderSortBy.CREATED_AT;

	@IsOptional()
	@IsEnum(SortOrder)
	sortOrder?: SortOrder = SortOrder.DESC;

	@IsOptional()
	@IsEnum(ProviderVerificationStatus)
	verification_status?: ProviderVerificationStatus;

	@IsOptional()
	@IsNumber()
	@Min(0)
	@Max(5)
	@Type(() => Number)
	min_rating?: number;

	@IsOptional()
	@IsNumber()
	@Min(0)
	@Max(5)
	@Type(() => Number)
	max_rating?: number;
}
