import { IsString, IsOptional, IsUrl } from "class-validator";

export class AppContextDto {
  @IsString()
  @IsOptional()
  applicationName?: string;

  @IsString()
  @IsOptional()
  appUrl?: string;

  @IsString()
  @IsOptional()
  ctaPath?: string;
}
