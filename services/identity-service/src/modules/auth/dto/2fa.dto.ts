import { IsString, IsOptional, IsArray, IsBoolean } from "class-validator";

export class Enable2faDto {
	@IsString()
	secret: string; // TOTP secret from frontend (QR code generation happens client-side)
}

export class Verify2faDto {
	@IsString()
	code: string; // 6-digit TOTP code
}

export class GenerateBackupCodesDto {
	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	codes?: string[]; // Optional: allow specifying custom codes
}

export class UseBackupCodeDto {
	@IsString()
	backupCode: string;
}

export class Disable2faDto {
	@IsString()
	password: string; // Require password to disable 2FA
	@IsOptional()
	@IsString()
	code?: string; // Optional: current TOTP code for extra verification
}
