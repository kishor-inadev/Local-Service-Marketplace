export class Refund {
  id: string;
  display_id: string;
  payment_id: string;
  amount: number;
  status: "pending" | "completed" | "failed";
  reason?: string;
  created_at: Date;

  constructor(partial: Partial<Refund>) {
    Object.assign(this, partial);
  }
}
