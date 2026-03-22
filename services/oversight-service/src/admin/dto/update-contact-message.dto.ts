import { IsNotEmpty, IsString, IsIn, IsOptional, IsUUID } from 'class-validator';

export class UpdateContactMessageDto {
  @IsNotEmpty()
  @IsString()
  @IsIn(['new', 'in_progress', 'resolved', 'closed'])
  status: string;

  @IsOptional()
  @IsString()
  admin_notes?: string;

  @IsOptional()
  @IsUUID()
  assigned_to?: string;
}
