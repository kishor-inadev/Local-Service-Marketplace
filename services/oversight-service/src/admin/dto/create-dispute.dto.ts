import { IsUUID, IsString, MinLength } from 'class-validator';

export class CreateDisputeDto {
	@IsUUID()
	job_id: string;

	@IsString()
	@MinLength(10)
	reason: string;
}
