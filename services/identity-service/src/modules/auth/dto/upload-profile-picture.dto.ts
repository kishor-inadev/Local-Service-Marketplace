import { IsUrl } from 'class-validator';

export class UploadProfilePictureDto {
  @IsUrl()
  url: string;
}
