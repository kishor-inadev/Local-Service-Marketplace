import { IsNotEmpty, IsString, IsUUID, IsOptional, IsObject } from 'class-validator';

export class TrackActivityDto {
  @IsNotEmpty()
  @IsUUID()
  user_id: string;

  @IsNotEmpty()
  @IsString()
  action: string;

  @IsOptional()
  @IsObject()
  metadata?: any;

  @IsOptional()
  @IsString()
  ip_address?: string;
}
