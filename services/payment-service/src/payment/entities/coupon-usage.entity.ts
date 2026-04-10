export class CouponUsage {
  id: string;
  coupon_id: string;
  user_id: string;
  used_at: Date;

  constructor(partial: Partial<CouponUsage>) {
    Object.assign(this, partial);
  }
}
