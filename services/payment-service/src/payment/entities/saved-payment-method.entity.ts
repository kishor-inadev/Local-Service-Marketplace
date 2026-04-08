export class SavedPaymentMethod {
  id: string;
  user_id: string;
  payment_type: "card" | "bank_account" | "paypal" | "other";
  card_brand?: string;
  last_four?: string;
  expiry_month?: number;
  expiry_year?: number;
  is_default: boolean;
  billing_email?: string;
  gateway_customer_id?: string;
  gateway_payment_method_id?: string;
  created_at: Date;
}
