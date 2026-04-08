import { IsString, MinLength } from "class-validator";

export class RespondReviewDto {
  @IsString()
  @MinLength(10)
  response: string;
}
