import { IsString, IsNotEmpty, IsOptional } from "class-validator";

export class CreateMessageDto {
  @IsString()
  job_id: string;

  @IsOptional()
  @IsString()
  sender_id?: string;

  @IsString()
  @IsNotEmpty()
  message: string;
}
