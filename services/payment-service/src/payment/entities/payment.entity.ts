export class Payment {
	id: string;
	job_id: string;
	user_id: string;
	provider_id: string;
	amount: number;
	platform_fee: number;
	provider_amount?: number;
	currency: string;
	payment_method?: string;
	/** Payment gateway used: stripe | razorpay | paypal | mock */
	gateway?: string;
	status: "pending" | "completed" | "failed" | "refunded";
	transaction_id?: string;
	failed_reason?: string;
	created_at: Date;
	paid_at?: Date;

	constructor(partial: Partial<Payment>) {
		Object.assign(this, partial);
	}
}
