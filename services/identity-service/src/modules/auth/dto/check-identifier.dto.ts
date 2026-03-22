import { IsString, IsNotEmpty, IsIn } from 'class-validator';

export class CheckIdentifierDto {
  @IsString()
  @IsNotEmpty()
  identifier: string;

  @IsString()
  @IsIn(['email', 'phone'], {
    message: 'Type must be either "email" or "phone"',
  })
  type: 'email' | 'phone';
}

export class CheckIdentifierResponseDto {
  exists: boolean;
  type: 'email' | 'phone';
  otpAvailable: boolean; // Whether OTP service (SMS/Email) is enabled
  availableMethods: ('password' | 'otp')[]; // Available auth methods
}
