import { IsOptional, IsEnum, IsNumber, Min, IsUUID } from "class-validator";

export class FilterRequestsDto {
  @IsOptional()
  @IsEnum(["low", "medium", "high", "urgent"])
  urgency?: "low" | "medium" | "high" | "urgent";

  @IsOptional()
  @IsEnum(["open", "in_progress", "completed", "cancelled"])
  status?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  min_budget?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  max_budget?: number;

  @IsOptional()
  @IsUUID()
  category_id?: string;
}
