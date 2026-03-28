import { IsEnum, IsOptional, IsString } from "class-validator";
import { AdminListQueryDto } from "./admin-list-query.dto";

export enum SystemSettingSortBy {
	KEY = "key",
	UPDATED_AT = "updatedAt",
}

export class SystemSettingQueryDto extends AdminListQueryDto {
	@IsOptional()
	@IsString()
	search?: string;

	@IsOptional()
	@IsEnum(SystemSettingSortBy)
	sortBy?: SystemSettingSortBy = SystemSettingSortBy.KEY;
}
