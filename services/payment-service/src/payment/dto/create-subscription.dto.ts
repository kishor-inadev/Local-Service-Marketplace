import { IsUUID, IsNotEmpty } from "class-validator";

export class CreateSubscriptionDto {
  @IsUUID()
  @IsNotEmpty()
  provider_id: string;

  @IsUUID()
  @IsNotEmpty()
  plan_id: string;
}
