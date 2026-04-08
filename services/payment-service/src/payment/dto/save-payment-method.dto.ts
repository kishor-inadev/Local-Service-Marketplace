import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsNumber,
  Min,
  Max,
  IsEmail,
  IsUUID,
} from "class-validator";

export class SavePaymentMethodDto {
  @IsUUID()
  user_id: string;

  @IsEnum(["card", "bank_account", "paypal", "other"])
  payment_type: "card" | "bank_account" | "paypal" | "other";

  @IsOptional()
  @IsString()
  card_brand?: string;

  @IsOptional()
  @IsString()
  last_four?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(12)
  expiry_month?: number;

  @IsOptional()
  @IsNumber()
  expiry_year?: number;

  @IsOptional()
  @IsBoolean()
  is_default?: boolean;

  @IsOptional()
  @IsEmail()
  billing_email?: string;

  @IsOptional()
  @IsString()
  gateway_customer_id?: string;

  @IsOptional()
  @IsString()
  gateway_payment_method_id?: string;
}
