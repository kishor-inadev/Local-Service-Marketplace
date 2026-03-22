export class User {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  password_hash?: string;
  role: string;
  email_verified: boolean;
  phone_verified: boolean;              // ✅ NEW
  profile_picture_url?: string;         // ✅ NEW
  timezone: string;                      // ✅ NEW (default: 'UTC')
  language: string;                      // ✅ NEW (default: 'en')
  last_login_at?: Date;                  // ✅ NEW
  status: string;
  created_at: Date;
  updated_at?: Date;
  deleted_at?: Date;                     // ✅ NEW
}
