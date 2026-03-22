export class NotificationPreferences {
  id: string;
  user_id: string;
  email_notifications: boolean;
  sms_notifications: boolean;
  push_notifications: boolean;
  marketing_emails: boolean;
  new_request_alerts: boolean;
  proposal_alerts: boolean;
  job_updates: boolean;
  payment_alerts: boolean;
  review_alerts: boolean;
  message_alerts: boolean;
  created_at: Date;
  updated_at?: Date;
}
