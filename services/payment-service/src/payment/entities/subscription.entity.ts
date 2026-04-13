export class Subscription {
  id: string;
  display_id: string;
  provider_id: string;
  plan_id: string;
  status: "active" | "cancelled" | "expired" | "pending";
  started_at: Date;
  expires_at?: Date;
  cancelled_at?: Date;
  created_at: Date;
  // Joined from subscription_plans (present when queried with plan join)
  price?: number;
  billing_period?: string;
  plan_name?: string;
}
