import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsObject,
  IsEmail,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { AppContextDto } from "./app-context.dto";

export class SendEmailDto {
  @IsEmail()
  @IsNotEmpty()
  to: string;

  @IsString()
  @IsOptional()
  subject?: string;

  @IsString()
  @IsOptional()
  message?: string; // plain text or HTML

  @IsString()
  @IsOptional()
  template?: string; // template name from marketplaceTemplates

  @IsObject()
  @IsOptional()
  variables?: Record<string, any>; // template variables

  @IsOptional()
  @ValidateNested()
  @Type(() => AppContextDto)
  appContext?: AppContextDto;
}
