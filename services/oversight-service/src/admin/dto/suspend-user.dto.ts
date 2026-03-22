import { IsNotEmpty, IsString, IsBoolean, IsOptional } from 'class-validator';

export class SuspendUserDto {
  @IsNotEmpty()
  @IsBoolean()
  suspended: boolean;

  @IsOptional()
  @IsString()
  reason?: string;
}
