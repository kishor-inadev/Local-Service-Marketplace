export class AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name?: string;
    role: string;
    email_verified: boolean;
    phone_verified: boolean;           // ✅ NEW
    profile_picture_url?: string;      // ✅ NEW
    timezone: string;                   // ✅ NEW
    language: string;                   // ✅ NEW
    last_login_at?: Date;               // ✅ NEW
  };
}
