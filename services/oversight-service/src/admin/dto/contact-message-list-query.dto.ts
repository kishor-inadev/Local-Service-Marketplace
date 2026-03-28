import { IsEnum, IsOptional, IsString, IsUUID } from "class-validator";
import { AdminListQueryDto } from "./admin-list-query.dto";

export enum ContactMessageStatusFilter {
	NEW = "new",
	IN_PROGRESS = "in_progress",
	RESOLVED = "resolved",
	CLOSED = "closed",
}

export enum ContactMessageSortBy {
	CREATED_AT = "createdAt",
	STATUS = "status",
	EMAIL = "email",
	RESOLVED_AT = "resolvedAt",
}

export class ContactMessageListQueryDto extends AdminListQueryDto {
	@IsOptional()
	@IsEnum(ContactMessageStatusFilter)
	status?: ContactMessageStatusFilter;

	@IsOptional()
	@IsUUID()
	userId?: string;

	@IsOptional()
	@IsUUID()
	assignedTo?: string;

	@IsOptional()
	@IsString()
	email?: string;

	@IsOptional()
	@IsString()
	search?: string;

	@IsOptional()
	@IsEnum(ContactMessageSortBy)
	sortBy?: ContactMessageSortBy = ContactMessageSortBy.CREATED_AT;
}
