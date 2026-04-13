import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsObject,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { AppContextDto } from "./app-context.dto";

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
  @IsOptional()
  subject?: string; // for email

  @IsString()
  @IsOptional()
  message?: string; // plain text message or SMS body

  @IsString()
  @IsOptional()
  template?: string; // template name (e.g., 'welcome', 'otp', 'passwordReset')

  @IsObject()
  @IsOptional()
  variables?: Record<string, any>; // template variables

  @IsString()
  @IsOptional()
  userId?: string; // optional user ID for tracking

  @IsOptional()
  @ValidateNested()
  @Type(() => AppContextDto)
  appContext?: AppContextDto;
}
