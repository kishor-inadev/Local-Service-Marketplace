import { IsString } from 'class-validator';

export class CreateFavoriteDto {
  @IsString()
  user_id: string;

  @IsString()
  provider_id: string;
}
