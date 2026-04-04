import { IsEmail, IsString, MaxLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MaxLength(72, { message: 'Password must not exceed 72 characters' })
  password: string;
}
