import { IsArray, IsUUID, ArrayNotEmpty } from 'class-validator';

/**
 * DTO for updating provider service categories
 */
export class UpdateProviderServicesDto {
  @IsArray()
  @ArrayNotEmpty({ message: 'At least one service category is required' })
  @IsUUID('4', { each: true, message: 'Each service category must be a valid UUID' })
  service_categories: string[];
}
