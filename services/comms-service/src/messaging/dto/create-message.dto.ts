import { IsUUID, IsString, IsNotEmpty } from 'class-validator';

export class CreateMessageDto {
  @IsUUID()
  job_id: string;

  @IsUUID()
  sender_id: string;

  @IsString()
  @IsNotEmpty()
  message: string;
}
