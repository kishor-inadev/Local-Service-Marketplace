import { IsEnum, IsOptional, IsUUID } from "class-validator";
import { AdminListQueryDto } from "./admin-list-query.dto";

export enum DisputeStatusFilter {
	OPEN = "open",
	INVESTIGATING = "investigating",
	RESOLVED = "resolved",
	CLOSED = "closed",
}

export enum DisputeSortBy {
	CREATED_AT = "createdAt",
	STATUS = "status",
	RESOLVED_AT = "resolvedAt",
}

export class DisputeListQueryDto extends AdminListQueryDto {
	@IsOptional()
	@IsEnum(DisputeStatusFilter)
	status?: DisputeStatusFilter;

	@IsOptional()
	@IsUUID()
	jobId?: string;

	@IsOptional()
	@IsUUID()
	openedBy?: string;

	@IsOptional()
	@IsEnum(DisputeSortBy)
	sortBy?: DisputeSortBy = DisputeSortBy.CREATED_AT;
}
