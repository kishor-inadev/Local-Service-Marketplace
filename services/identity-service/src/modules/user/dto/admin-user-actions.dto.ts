import { IsOptional, IsString, Length } from "class-validator";

export class SuspendUserDto {
	@IsOptional()
	@IsString()
	@Length(0, 500)
	reason?: string;
}

export class ResetUserPasswordDto {
	@IsString()
	@Length(8, 128)
	newPassword: string;

	@IsOptional()
	@IsString()
	@Length(0, 500)
	reason?: string;
}
