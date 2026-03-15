export class Payment {
  id: string;
  job_id: string;
  user_id: string;                       // ✅ REQUIRED (was optional)
  provider_id: string;                   // ✅ NEW
  amount: number;
  platform_fee: number;                  // ✅ NEW
  provider_amount: number;               // ✅ NEW
  currency: string;
  payment_method?: string;               // ✅ NEW
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  transaction_id?: string;
  failed_reason?: string;                // ✅ NEW
  created_at: Date;
  paid_at?: Date;                        // ✅ NEW - When payment was completed

  constructor(partial: Partial<Payment>) {
    Object.assign(this, partial);
  }
}
