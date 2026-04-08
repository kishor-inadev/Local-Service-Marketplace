export class Subscription {
  id: string;
  provider_id: string;
  plan_id: string;
  status: "active" | "cancelled" | "expired" | "pending";
  started_at: Date;
  expires_at?: Date;
  cancelled_at?: Date;
  created_at: Date;
}
