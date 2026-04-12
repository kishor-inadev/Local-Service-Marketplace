import { IsString, IsNumber, IsOptional, Min, Max, IsEnum } from "class-validator";

export class CreatePaymentDto {
  @IsString()
  job_id: string;

  @IsString()
  provider_id: string;

  @IsNumber()
  @Min(0.01)
  @Max(1_000_000)
  amount: number;

  @IsEnum(["USD", "EUR", "GBP", "INR"])
  currency: string;

  @IsOptional()
  @IsEnum(["card", "bank_transfer", "wallet", "cash"])
  payment_method?: "card" | "bank_transfer" | "wallet" | "cash";

  @IsOptional()
  @IsString()
  coupon_code?: string;
}
