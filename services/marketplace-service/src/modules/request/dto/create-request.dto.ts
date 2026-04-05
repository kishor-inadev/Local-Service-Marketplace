import { IsString, IsNumber, IsOptional, MinLength, Min, IsObject, ValidateNested, IsArray, IsEnum, IsDateString, ArrayMaxSize, IsUrl } from 'class-validator';
import { Type } from 'class-transformer';

export class LocationDto {
  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  zipCode?: string;

  @IsOptional()
  @IsString()
  country?: string;
}

export class CreateRequestDto {
  @IsOptional()
  @IsString()
  user_id?: string;

  @IsOptional()
  @IsObject()
  guest_info?: {
    name: string;
    email: string;
    phone: string;
  };

  @IsString()
  category_id: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => LocationDto)
  location?: LocationDto;

  @IsString()
  @MinLength(10)
  description: string;

  @IsNumber()
  @Min(0)
  budget: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsUrl({}, { each: true })
  images?: string[];

  @IsOptional()
  @IsDateString()
  preferred_date?: string;

  @IsOptional()
  @IsEnum(['low', 'medium', 'high', 'urgent'])
  urgency?: 'low' | 'medium' | 'high' | 'urgent';

  @IsOptional()
  @IsDateString()
  expiry_date?: string;
}
