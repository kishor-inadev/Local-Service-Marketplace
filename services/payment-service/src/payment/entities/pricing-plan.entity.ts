export class PricingPlan {
  id: string;
  name: string;
  description?: string;
  price: number;
  billing_period: "monthly" | "yearly";
  features?: any;
  active: boolean;
  created_at: Date;
}
