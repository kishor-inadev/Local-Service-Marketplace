import { IsString, IsEnum, MinLength } from "class-validator";

export class CancelJobDto {
  @IsEnum(["customer", "provider", "admin"])
  cancelled_by: "customer" | "provider" | "admin";

  @IsString()
  @MinLength(5)
  reason: string;
}
