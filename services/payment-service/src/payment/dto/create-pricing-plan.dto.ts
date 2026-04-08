import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsBoolean,
  Min,
  MinLength,
} from "class-validator";

export class CreatePricingPlanDto {
  @IsString()
  @MinLength(3)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsEnum(["monthly", "yearly"])
  billing_period: "monthly" | "yearly";

  @IsOptional()
  features?: any;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
