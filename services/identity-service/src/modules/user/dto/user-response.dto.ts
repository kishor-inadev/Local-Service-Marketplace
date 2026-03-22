export class UserResponseDto {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  role: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  profilePictureUrl?: string;
  timezone: string;
  language: string;
  lastLoginAt?: Date;
  status: string;
  createdAt: Date;
  updatedAt?: Date;
}
