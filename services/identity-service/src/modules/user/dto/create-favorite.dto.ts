import { IsUUID } from 'class-validator';

export class CreateFavoriteDto {
  @IsUUID()
  user_id: string;

  @IsUUID()
  provider_id: string;
}
