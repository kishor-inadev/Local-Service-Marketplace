import { IsString } from "class-validator";

export class ValidateCouponDto {
  @IsString()
  couponCode: string;
}
