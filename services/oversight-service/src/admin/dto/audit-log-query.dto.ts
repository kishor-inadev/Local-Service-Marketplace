import { IsEnum, IsOptional, IsString, IsUUID } from "class-validator";
import { AdminListQueryDto } from "./admin-list-query.dto";

export enum AuditLogSortBy {
	CREATED_AT = "createdAt",
	ACTION = "action",
	ENTITY = "entity",
}

export class AuditLogQueryDto extends AdminListQueryDto {
	@IsOptional()
	@IsUUID()
	userId?: string;

	@IsOptional()
	@IsString()
	action?: string;

	@IsOptional()
	@IsString()
	entity?: string;

	@IsOptional()
	@IsUUID()
	entityId?: string;

	@IsOptional()
	@IsEnum(AuditLogSortBy)
	sortBy?: AuditLogSortBy = AuditLogSortBy.CREATED_AT;
}
