import { IsString, MinLength } from 'class-validator';

export class RejectProposalDto {
  @IsString()
  @MinLength(5)
  reason: string;
}
