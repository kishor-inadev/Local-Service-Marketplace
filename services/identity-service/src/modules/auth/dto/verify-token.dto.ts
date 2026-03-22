import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyTokenDto {
  @IsNotEmpty()
  @IsString()
  token: string;
}

export class VerifyTokenResponseDto {
  userId: string;
  email: string;
  role: string;
  name?: string;
  phone?: string;
}
