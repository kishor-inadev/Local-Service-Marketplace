import { IsString, IsOptional, IsArray, IsUUID, IsNumber, Min, Max, ValidateNested, IsUrl, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

class AvailabilitySlotDto {
  @IsNumber()
  @Min(0)
  @Max(6)
  day_of_week: number;

  @IsString()
  start_time: string;

  @IsString()
  end_time: string;
}

class CertificationDto {
  @IsString()
  name: string;

  @IsString()
  issuer: string;

  @IsDateString()
  issue_date: string;

  @IsOptional()
  @IsDateString()
  expiry_date?: string;

  @IsOptional()
  @IsUrl()
  certificate_url?: string;
}

export class UpdateProviderDto {
  @IsString()
  @IsOptional()
  business_name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  service_categories?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AvailabilitySlotDto)
  @IsOptional()
  availability?: AvailabilitySlotDto[];

  @IsOptional()
  @IsUrl()
  profile_picture_url?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(50)
  years_of_experience?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(500)
  service_area_radius?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CertificationDto)
  certifications?: CertificationDto[];
}
