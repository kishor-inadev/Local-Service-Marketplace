import { Type } from "class-transformer";
import { IsDate, IsEnum, IsInt, IsOptional, Max, Min } from "class-validator";

export enum SortOrder {
	ASC = "asc",
	DESC = "desc",
}

export class AdminListQueryDto {
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	@Max(1000)
	page?: number = 1;

	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	@Max(100)
	limit?: number = 20;

	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(0)
	offset?: number;

	@IsOptional()
	@IsEnum(SortOrder)
	sortOrder?: SortOrder = SortOrder.DESC;

	@IsOptional()
	@Type(() => Date)
	@IsDate()
	createdFrom?: Date;

	@IsOptional()
	@Type(() => Date)
	@IsDate()
	createdTo?: Date;
}
