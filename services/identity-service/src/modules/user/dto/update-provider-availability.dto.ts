import { IsArray, IsNumber, IsString, Min, Max, ValidateNested, ArrayNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for a single availability time slot
 */
export class AvailabilitySlotDto {
  @IsNumber()
  @Min(0, { message: 'day_of_week must be between 0 (Sunday) and 6 (Saturday)' })
  @Max(6, { message: 'day_of_week must be between 0 (Sunday) and 6 (Saturday)' })
  day_of_week: number;

  @IsString()
  start_time: string; // Format: "HH:MM" (24-hour)

  @IsString()
  end_time: string; // Format: "HH:MM" (24-hour)
}

/**
 * DTO for updating provider availability schedule
 */
export class UpdateProviderAvailabilityDto {
  @IsArray()
  @ArrayNotEmpty({ message: 'At least one availability slot is required' })
  @ValidateNested({ each: true })
  @Type(() => AvailabilitySlotDto)
  availability: AvailabilitySlotDto[];
}
