import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, Length, Matches } from "class-validator";

export enum AdminCreateUserRole {
	CUSTOMER = "customer",
	PROVIDER = "provider",
	ADMIN = "admin",
}

export enum AdminCreateUserStatus {
	ACTIVE = "active",
	SUSPENDED = "suspended",
}

export class AdminCreateUserDto {
	@IsEmail()
	email: string;

	@IsString()
	@Length(8, 128)
	password: string;

	@IsOptional()
	@IsString()
	@Length(1, 255)
	name?: string;

	@IsOptional()
	@IsString()
	@Matches(/^\+?[0-9]{10,15}$/, { message: "phone must be a valid E.164-like number" })
	phone?: string;

	@IsEnum(AdminCreateUserRole)
	role: AdminCreateUserRole;

	@IsOptional()
	@IsBoolean()
	emailVerified?: boolean;

	@IsOptional()
	@IsString()
	timezone?: string;

	@IsOptional()
	@IsString()
	language?: string;

	@IsOptional()
	@IsEnum(AdminCreateUserStatus)
	status?: AdminCreateUserStatus;
}
