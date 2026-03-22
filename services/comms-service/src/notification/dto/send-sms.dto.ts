import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class SendSmsDto {
  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsOptional()
  purpose?: string; // e.g., 'otp', 'notification', 'alert'
}

export class SendOtpDto {
  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsOptional()
  purpose?: string; // default: 'login'
}

export class VerifyOtpDto {
  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsOptional()
  purpose?: string; // default: 'login'
}
