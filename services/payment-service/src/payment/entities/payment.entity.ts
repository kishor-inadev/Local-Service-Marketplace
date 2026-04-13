export class Payment {
  id: string;
  display_id: string;
  job_id: string;
  user_id: string;
  provider_id: string;
  amount: number;
  platform_fee: number;
  provider_amount?: number;
  currency: string;
  payment_method?: string;
  /** Payment gateway used: stripe | razorpay | paypal | payubiz | instamojo | mock */
  gateway: string;
  status: "pending" | "completed" | "failed" | "refunded";
  transaction_id?: string;
  failed_reason?: string;
  /** GST rate applied on platform fee (default 18.00 for India) */
  gst_rate: number;
  /** GST amount = platform_fee * gst_rate / 100 */
  gst_amount: number;
  created_at: Date;
  paid_at?: Date;

  constructor(partial: Partial<Payment>) {
    Object.assign(this, partial);
  }
}
