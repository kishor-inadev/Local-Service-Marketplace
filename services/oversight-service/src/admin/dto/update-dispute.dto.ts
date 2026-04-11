import { IsNotEmpty, IsString, IsIn, IsOptional } from 'class-validator';

export class UpdateDisputeDto {
	@IsNotEmpty()
	@IsString()
	@IsIn(["open", "in_progress", "investigating", "resolved", "closed"])
	status: string;

	@IsOptional()
	@IsString()
	resolution?: string;
}
