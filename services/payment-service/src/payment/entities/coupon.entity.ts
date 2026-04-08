export class Coupon {
  id: string;
  code: string;
  discount_percent: number;
  max_uses?: number; // ✅ NEW
  max_uses_per_user: number; // ✅ NEW
  min_purchase_amount?: number; // ✅ NEW
  active: boolean; // ✅ NEW
  created_by?: string; // ✅ NEW
  expires_at?: Date;
  created_at?: Date; // ✅ NEW

  constructor(partial: Partial<Coupon>) {
    Object.assign(this, partial);
  }
}
