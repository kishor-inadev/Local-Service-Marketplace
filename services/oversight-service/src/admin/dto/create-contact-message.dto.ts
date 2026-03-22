import { IsNotEmpty, IsString, IsEmail, MaxLength, MinLength, IsOptional, IsUUID } from 'class-validator';

export class CreateContactMessageDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @IsNotEmpty()
  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  subject: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(10)
  message: string;

  @IsOptional()
  @IsUUID()
  user_id?: string;

  @IsOptional()
  @IsString()
  ip_address?: string;

  @IsOptional()
  @IsString()
  user_agent?: string;
}
