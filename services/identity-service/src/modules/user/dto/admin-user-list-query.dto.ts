import { Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export enum AdminUserRoleFilter {
	CUSTOMER = "customer",
	PROVIDER = "provider",
	ADMIN = "admin",
}

export enum AdminUserStatusFilter {
	ACTIVE = "active",
	SUSPENDED = "suspended",
}

export enum AdminUserSortBy {
	CREATED_AT = "createdAt",
	EMAIL = "email",
	NAME = "name",
	ROLE = "role",
	LAST_LOGIN_AT = "lastLoginAt",
}

export enum SortOrder {
	ASC = "asc",
	DESC = "desc",
}

export class AdminUserListQueryDto {
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	page?: number = 1;

	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	@Max(100)
	limit?: number = 20;

	@IsOptional()
	@IsString()
	search?: string;

	@IsOptional()
	@IsEnum(AdminUserRoleFilter)
	role?: AdminUserRoleFilter;

	@IsOptional()
	@IsEnum(AdminUserStatusFilter)
	status?: AdminUserStatusFilter;

	@IsOptional()
	@IsEnum(AdminUserSortBy)
	sortBy?: AdminUserSortBy = AdminUserSortBy.CREATED_AT;

	@IsOptional()
	@IsEnum(SortOrder)
	sortOrder?: SortOrder = SortOrder.DESC;
}
