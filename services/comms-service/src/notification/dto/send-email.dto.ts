import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsObject,
  IsEmail,
} from "class-validator";

export class SendEmailDto {
  @IsEmail()
  @IsNotEmpty()
  to: string;

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsNotEmpty()
  message: string; // plain text or HTML

  @IsString()
  @IsOptional()
  template?: string; // template name from marketplaceTemplates

  @IsObject()
  @IsOptional()
  variables?: Record<string, any>; // template variables
}
