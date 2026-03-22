import { IsOptional, IsString, IsEnum, IsUrl } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsUrl()
  profile_picture_url?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsEnum(['en', 'es', 'fr', 'de', 'zh', 'ar', 'hi'])
  language?: string;
}
