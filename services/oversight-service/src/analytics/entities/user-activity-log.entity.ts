export class UserActivityLog {
  id: string;
  user_id: string;
  action: string;
  metadata: any;
  ip_address: string;
  created_at: Date;
}
