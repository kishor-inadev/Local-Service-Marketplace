export interface Unsubscribe {
  id: string;
  user_id: string | null;
  email: string;
  reason: string | null;
  unsubscribed_at: Date;
  created_at: Date;
}
