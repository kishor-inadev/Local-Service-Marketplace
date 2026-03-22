export interface User {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  password_hash: string;
  role: string; // 'customer' | 'provider' | 'admin'
  email_verified: boolean;
  phone_verified: boolean;
  profile_picture_url?: string;
  timezone: string;
  language: string;
  last_login_at?: Date;
  status: string; // 'active' | 'suspended' | 'deleted'
  created_at: Date;
  updated_at?: Date;
  deleted_at?: Date;
}
