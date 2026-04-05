import { IsString, IsOptional, IsArray, IsNumber, Min, Max, ValidateNested } from 'class-validator';
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

export class CreateProviderDto {
  @IsString()
  user_id: string;

  @IsString()
  business_name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  service_categories?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AvailabilitySlotDto)
  @IsOptional()
  availability?: AvailabilitySlotDto[];
}
