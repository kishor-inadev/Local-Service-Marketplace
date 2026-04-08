import { IsBoolean, IsOptional, IsUUID } from "class-validator";

export class UpdateNotificationPreferencesDto {
  @IsOptional()
  @IsBoolean()
  email_notifications?: boolean;

  @IsOptional()
  @IsBoolean()
  sms_notifications?: boolean;

  @IsOptional()
  @IsBoolean()
  push_notifications?: boolean;

  @IsOptional()
  @IsBoolean()
  marketing_emails?: boolean;

  @IsOptional()
  @IsBoolean()
  new_request_alerts?: boolean;

  @IsOptional()
  @IsBoolean()
  proposal_alerts?: boolean;

  @IsOptional()
  @IsBoolean()
  job_updates?: boolean;

  @IsOptional()
  @IsBoolean()
  payment_alerts?: boolean;

  @IsOptional()
  @IsBoolean()
  review_alerts?: boolean;

  @IsOptional()
  @IsBoolean()
  message_alerts?: boolean;
}
