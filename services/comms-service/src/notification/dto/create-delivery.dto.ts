import { IsUUID, IsString, IsIn } from 'class-validator';

export class CreateDeliveryDto {
  @IsUUID()
  notification_id: string;

  @IsString()
  @IsIn(['email', 'push', 'sms'])
  channel: string;

  @IsString()
  @IsIn(['pending', 'sent', 'failed'])
  status: string;
}
