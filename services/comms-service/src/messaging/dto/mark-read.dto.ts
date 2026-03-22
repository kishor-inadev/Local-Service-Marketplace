import { IsArray, IsUUID } from 'class-validator';

export class MarkMessagesReadDto {
  @IsArray()
  @IsUUID('4', { each: true })
  message_ids: string[];
}
