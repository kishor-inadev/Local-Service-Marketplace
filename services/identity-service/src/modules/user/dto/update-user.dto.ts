import { IsOptional, IsString, IsEmail, Matches } from "class-validator";

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @Matches(/^(\+91)?[6-9]\d{9}$/, {
    message: "Phone must be a valid 10-digit Indian mobile number",
  })
  phone?: string;

  @IsOptional()
  @IsString()
  profilePictureUrl?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  language?: string;
}
