import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  IsBoolean,
  Min,
  Max,
  IsUUID,
} from "class-validator";

export class CreateCouponDto {
  @IsString()
  code: string;

  @IsNumber()
  @Min(1)
  @Max(100)
  discount_percent: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  max_uses?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  max_uses_per_user?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  min_purchase_amount?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsDateString()
  expires_at: string;

  @IsOptional()
  @IsUUID()
  created_by?: string;
}
