import { IsString, IsOptional } from "class-validator";

export class CreateFavoriteDto {
  @IsString()
  @IsOptional()
  user_id?: string;

  @IsString()
  provider_id: string;
}
