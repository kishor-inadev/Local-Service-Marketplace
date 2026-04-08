import { IsUUID, IsNotEmpty } from "class-validator";

export class UpgradeSubscriptionDto {
  @IsUUID()
  @IsNotEmpty()
  new_plan_id: string;
}
