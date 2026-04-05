import { IsOptional, IsString, IsNumber, Min, Max, IsEnum, IsDateString } from "class-validator";
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

export enum RequestStatus {
	OPEN = "open",
	ASSIGNED = "assigned",
	COMPLETED = "completed",
	CANCELLED = "cancelled",
}

export enum RequestUrgency {
	LOW = "low",
	MEDIUM = "medium",
	HIGH = "high",
	URGENT = "urgent",
}

export class RequestQueryDto {
	@IsOptional()
	@IsString()
	user_id?: string;

	@IsOptional()
	@IsString()
	category_id?: string;

	@IsOptional()
	@IsEnum(RequestStatus)
	status?: RequestStatus;

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
	@Max(1000)
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
	@IsEnum(RequestUrgency)
	urgency?: RequestUrgency;

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
