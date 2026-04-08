import { IsString, IsUUID, IsUrl, IsOptional, IsNumber } from "class-validator";

export class CreateAttachmentDto {
  @IsUUID()
  message_id: string;

  @IsUrl()
  file_url: string;

  @IsString()
  @IsOptional()
  file_name?: string;

  @IsNumber()
  @IsOptional()
  file_size?: number;

  @IsString()
  @IsOptional()
  mime_type?: string;
}
