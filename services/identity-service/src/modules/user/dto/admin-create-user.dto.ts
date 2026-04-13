import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Length,
  Matches,
} from "class-validator";

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
  @Matches(/^(\+91)?[6-9]\d{9}$/, {
    message: "Phone must be a valid 10-digit Indian mobile number",
  })
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
