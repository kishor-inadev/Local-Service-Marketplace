import { IsNumber, IsString, IsOptional, Min } from "class-validator";

export class RequestRefundDto {
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  amount?: number; // Optional - defaults to full payment amount

  @IsString()
  reason: string;
}
