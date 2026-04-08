import { IsString, IsObject } from "class-validator";

export class WebhookPayloadDto {
  @IsString()
  gateway: string;

  @IsObject()
  payload: Record<string, any>;
}
