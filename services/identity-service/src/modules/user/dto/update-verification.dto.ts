import { IsEnum } from 'class-validator';

export class UpdateVerificationStatusDto {
  @IsEnum(['pending', 'verified', 'rejected'])
  status: 'pending' | 'verified' | 'rejected';
}
