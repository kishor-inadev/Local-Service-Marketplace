import { IsUUID } from 'class-validator';

export class MarkHelpfulDto {
  @IsUUID()
  review_id: string;
}


