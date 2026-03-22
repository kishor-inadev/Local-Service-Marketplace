export class ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  user_id?: string;
  assigned_to?: string;
  admin_notes?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
  updated_at?: Date;
  resolved_at?: Date;
}
