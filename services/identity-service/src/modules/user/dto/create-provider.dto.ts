import {
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  Min,
  Max,
  ValidateNested,
  Matches,
} from "class-validator";
import { Type } from "class-transformer";

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
  @IsOptional()
  user_id?: string;

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

  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/, {
    message: "GSTIN must be a valid 15-character GST Identification Number",
  })
  gstin?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{5}[0-9]{4}[A-Z]$/, {
    message: "PAN must be a valid 10-character Permanent Account Number",
  })
  pan?: string;
}
