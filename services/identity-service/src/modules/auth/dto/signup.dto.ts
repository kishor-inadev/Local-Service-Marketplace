import { IsEmail, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';

export enum UserRole {
  CUSTOMER = 'customer',
  PROVIDER = 'provider',
  ADMIN = 'admin',
}

export class SignupDto {
	@IsEmail()
	email: string;

	@IsString()
	@MinLength(8, { message: "Password must be at least 8 characters long" })
	password: string;

	@IsOptional()
	@IsString()
	name?: string;

	@IsEnum(UserRole, { message: "Role must be either customer, provider, or admin" })
	@IsOptional()
	role?: UserRole = UserRole.CUSTOMER;

	@IsOptional()
	@IsString()
	phone?: string;

	@IsOptional() // ✅ NEW
	@IsString()
	timezone?: string;

	@IsOptional() // ✅ NEW
	@IsString()
	language?: string;
}
