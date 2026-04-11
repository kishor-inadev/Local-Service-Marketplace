import { IsString, IsOptional, MinLength, MaxLength } from "class-validator";

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: "Category name must be at least 2 characters" })
  @MaxLength(100, { message: "Category name must not exceed 100 characters" })
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: "Description must not exceed 500 characters" })
  description?: string;

  @IsOptional()
  @IsString()
  icon?: string;
}
