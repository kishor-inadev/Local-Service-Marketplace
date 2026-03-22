export class Notification {
  id: string;
  user_id: string;
  type: string;
  message: string;
  read: boolean;
  created_at: Date;

  constructor(partial: Partial<Notification>) {
    Object.assign(this, partial);
  }
}
