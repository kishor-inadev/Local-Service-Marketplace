import { IsNotEmpty, IsString, IsIn } from 'class-validator';

export class UpdateDisputeDto {
  @IsNotEmpty()
  @IsString()
  @IsIn(['open', 'in_progress', 'resolved', 'closed'])
  status: string;

  @IsNotEmpty()
  @IsString()
  resolution: string;
}
