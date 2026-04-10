export class Session {
  id: string;
  display_id: string;
  user_id: string;
  refresh_token: string;
  ip_address?: string;
  user_agent?: string;
  device_type?: string; // ✅ NEW
  location?: string; // ✅ NEW
  expires_at: Date;
  created_at: Date;
}
