import { IsOptional, IsInt, Min, Max, IsString, IsIn, IsEnum, IsDateString } from "class-validator";
import { Type } from "class-transformer";

export enum TransactionStatus {
	PENDING = "pending",
	COMPLETED = "completed",
	FAILED = "failed",
	REFUNDED = "refunded",
}

export enum TransactionSortBy {
	CREATED_AT = "created_at",
	PAID_AT = "paid_at",
	AMOUNT = "amount",
}

export enum SortOrder {
	ASC = "asc",
	DESC = "desc",
}

export class TransactionQueryDto {
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
	@Max(1000)
	page?: number;

	@IsOptional()
	@IsString()
	cursor?: string;

	@IsOptional()
	@IsEnum(TransactionStatus)
	status?: TransactionStatus;

	@IsOptional()
	@IsString()
	payment_method?: string;

	@IsOptional()
	@IsDateString()
	created_from?: string;

	@IsOptional()
	@IsDateString()
	created_to?: string;

	@IsOptional()
	@IsEnum(TransactionSortBy)
	sortBy?: TransactionSortBy = TransactionSortBy.CREATED_AT;

	@IsOptional()
	@IsEnum(SortOrder)
	sortOrder?: SortOrder = SortOrder.DESC;
}

export class TransactionDto {
	id: string;
	job_id: string;
	customer_id: string;
	provider_amount: number;
	platform_fee: number;
	total_amount: number;
	status: string;
	payment_method: string;
	transaction_id: string;
	currency: string;
	created_at: Date;
	paid_at?: Date;
	customer_name?: string;
}

export class PaginatedTransactionResponseDto {
	data: TransactionDto[];
	total?: number;
	nextCursor?: string;
	hasMore?: boolean;
}

export enum SubscriptionStatusQuery {
	ACTIVE = "active",
	CANCELLED = "cancelled",
	EXPIRED = "expired",
	PENDING = "pending",
}

export enum SubscriptionSortBy {
	CREATED_AT = "created_at",
	EXPIRES_AT = "expires_at",
}

export class SubscriptionQueryDto {
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
	@Max(1000)
	page?: number;

	@IsOptional()
	@IsString()
	cursor?: string;

	@IsOptional()
	@IsEnum(SubscriptionStatusQuery)
	status?: SubscriptionStatusQuery;

	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	@Max(90)
	days?: number;

	@IsOptional()
	@IsEnum(SubscriptionSortBy)
	sortBy?: SubscriptionSortBy = SubscriptionSortBy.CREATED_AT;

	@IsOptional()
	@IsEnum(SortOrder)
	sortOrder?: SortOrder = SortOrder.DESC;
}
