import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsObject,
} from "class-validator";

export enum NotificationChannel {
  EMAIL = "email",
  SMS = "sms",
  BOTH = "both",
}

export class SendNotificationDto {
  @IsString()
  @IsNotEmpty()
  recipient: string; // email address or phone number

  @IsEnum(NotificationChannel)
  channel: NotificationChannel;

  @IsString()
  @IsNotEmpty()
  subject: string; // for email

  @IsString()
  @IsNotEmpty()
  message: string; // plain text message or SMS body

  @IsString()
  @IsOptional()
  template?: string; // template name (e.g., 'welcome', 'otp', 'passwordReset')

  @IsObject()
  @IsOptional()
  variables?: Record<string, any>; // template variables

  @IsString()
  @IsOptional()
  userId?: string; // optional user ID for tracking
}
