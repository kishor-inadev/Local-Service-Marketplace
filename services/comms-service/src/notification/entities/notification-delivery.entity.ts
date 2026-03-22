export class NotificationDelivery {
  id: string;
  notification_id: string;
  channel: string;
  status: string;
  delivered_at?: Date;
  error_message?: string;

  constructor(partial: Partial<NotificationDelivery>) {
    Object.assign(this, partial);
  }
}
