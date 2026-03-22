export class LoginAttempt {
  id: string;
  email: string;
  ip_address?: string;
  user_agent?: string;
  location?: string;
  success: boolean;
  created_at: Date;
}
