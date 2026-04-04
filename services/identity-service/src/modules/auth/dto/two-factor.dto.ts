import { IsString, IsOptional } from 'class-validator';

export class VerifyTwoFactorDto {
  @IsString()
  code: string;
}

export class DisableTwoFactorDto {
  @IsString()
  password: string;

  @IsString()
  @IsOptional()
  code?: string;
}

export class VerifyBackupCodeDto {
  @IsString()
  backupCode: string;
}
