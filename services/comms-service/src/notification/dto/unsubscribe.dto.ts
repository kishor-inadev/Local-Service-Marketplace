import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class UnsubscribeDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class CheckUnsubscribeDto {
  @IsEmail()
  email: string;
}
