import { IsEnum, IsOptional, IsString } from "class-validator";
import { AdminListQueryDto } from "./admin-list-query.dto";

export enum UserRoleFilter {
	CUSTOMER = "customer",
	PROVIDER = "provider",
	ADMIN = "admin",
}

export enum UserStatusFilter {
	ACTIVE = "active",
	SUSPENDED = "suspended",
}

export enum UserSortBy {
	CREATED_AT = "createdAt",
	EMAIL = "email",
	NAME = "name",
	ROLE = "role",
	LAST_LOGIN_AT = "lastLoginAt",
}

export class UserListQueryDto extends AdminListQueryDto {
	@IsOptional()
	@IsString()
	search?: string;

	@IsOptional()
	@IsEnum(UserRoleFilter)
	role?: UserRoleFilter;

	@IsOptional()
	@IsEnum(UserStatusFilter)
	status?: UserStatusFilter;

	@IsOptional()
	@IsEnum(UserSortBy)
	sortBy?: UserSortBy = UserSortBy.CREATED_AT;
}
