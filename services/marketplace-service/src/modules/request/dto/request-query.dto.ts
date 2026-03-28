import { IsOptional, IsString, IsUUID, IsNumber, Min, Max, IsEnum, IsDateString } from "class-validator";
import { Type } from "class-transformer";

export enum RequestSortBy {
	CREATED_AT = "created_at",
	BUDGET = "budget",
	PREFERRED_DATE = "preferred_date",
}

export enum SortOrder {
	ASC = "asc",
	DESC = "desc",
}

export class RequestQueryDto {
	@IsOptional()
	@IsUUID()
	user_id?: string;

	@IsOptional()
	@IsUUID()
	category_id?: string;

	@IsOptional()
	@IsString()
	status?: string;

	@IsOptional()
	@IsNumber()
	@Type(() => Number)
	@Min(1)
	@Max(100)
	limit?: number = 20;

	@IsOptional()
	@IsString()
	cursor?: string;

	@IsOptional()
	@IsNumber()
	@Type(() => Number)
	@Min(1)
	page?: number;

	@IsOptional()
	@IsNumber()
	@Type(() => Number)
	@Min(0)
	min_budget?: number;

	@IsOptional()
	@IsNumber()
	@Type(() => Number)
	@Min(0)
	max_budget?: number;

	@IsOptional()
	@IsString()
	urgency?: string;

	@IsOptional()
	@IsDateString()
	created_from?: string;

	@IsOptional()
	@IsDateString()
	created_to?: string;

	@IsOptional()
	@IsEnum(RequestSortBy)
	sortBy?: RequestSortBy = RequestSortBy.CREATED_AT;

	@IsOptional()
	@IsEnum(SortOrder)
	sortOrder?: SortOrder = SortOrder.DESC;
}
