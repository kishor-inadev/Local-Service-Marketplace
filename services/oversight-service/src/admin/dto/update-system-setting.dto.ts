import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateSystemSettingDto {
  @IsNotEmpty()
  @IsString()
  value: string;
}
