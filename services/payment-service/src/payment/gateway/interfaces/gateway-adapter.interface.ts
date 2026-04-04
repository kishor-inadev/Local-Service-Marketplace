/**
 * Gateway Adapter Interface
 *
 * All payment gateway adapters (Stripe, Razorpay, PayPal, Mock) must
 * implement this interface so that PaymentGatewayService can orchestrate
 * them uniformly.
 *
 * Flow (backend-driven):
 *   1. Backend calls charge() → gateway creates an order/intent and returns
 *      transactionId + status (usually "pending" for gateways requiring
 *      client-side checkout widget interaction).
 *   2. User completes payment via hosted/embedded widget (Stripe Elements,
 *      Razorpay Checkout, PayPal Smart Buttons) using the transactionId.
 *   3. Gateway calls our webhook endpoint; WebhookService calls
 *      verifyWebhookSignature() then parseWebhookEvent() to update DB.
 *   4. Refunds are initiated server-side via refund().
 */

export interface ChargeParams {
	/** Amount in base currency unit (e.g. dollars, rupees — NOT cents/paise). */
	amount: number;
	/** ISO 4217 currency code, e.g. "usd", "inr". */
	currency: string;
	/** Customer email — used by Razorpay and PayPal. */
	customerEmail?: string;
	/** Human-readable description of the payment. */
	description?: string;
	/** Arbitrary metadata forwarded to the gateway (e.g. job_id, user_id). */
	metadata?: Record<string, string>;
}

export interface ChargeResult {
	/** Gateway-specific transaction / order / intent ID. */
	transactionId: string;
	/**
	 * - "succeeded" : payment was immediately captured (Stripe server-side confirm,
	 *                 Mock adapter, etc.)
	 * - "pending"   : order/intent created; awaiting client-side confirmation or
	 *                 async capture (Razorpay, PayPal standard flow).
	 * - "failed"    : gateway rejected the charge immediately.
	 */
	status: "succeeded" | "pending" | "failed";
	/** Raw response payload from the gateway, useful for debugging. */
	gatewayResponse?: Record<string, any>;
}

export interface RefundParams {
	/** Gateway transaction ID (payment_intent for Stripe, payment ID for Razorpay, capture ID for PayPal). */
	transactionId: string;
	/** Amount to refund in base currency unit. Omit for full refund. */
	amount?: number;
	/** Human-readable reason for the refund. */
	reason?: string;
}

export interface RefundResult {
	/** Gateway-specific refund ID. */
	refundId: string;
	/** Current status of the refund: "succeeded", "pending", etc. */
	status: string;
}

export interface ParsedWebhookEvent {
	/**
	 * Normalised event type across all gateways:
	 * - "payment.succeeded" — payment capture confirmed
	 * - "payment.failed"    — payment failed or was declined
	 * - "refund.created"    — refund was initiated
	 * - "unknown"           — any other event the service doesn't handle
	 */
	eventType: "payment.succeeded" | "payment.failed" | "refund.created" | "unknown";
	/** Gateway-level transaction ID. */
	transactionId?: string;
	/** Application-level payment UUID (from gateway metadata, if available). */
	paymentId?: string;
	/** Amount in base currency unit. */
	amount?: number;
	currency?: string;
}

export interface IGatewayAdapter {
	/**
	 * Human-readable name of the gateway (e.g. "stripe", "razorpay", "paypal", "mock").
	 * Used to record the `gateway` column in the payments table.
	 */
	readonly gatewayName: string;

	/**
	 * Initiate a payment.
	 * Returns a transactionId that can be passed to the client for checkout widget
	 * completion, or "succeeded" immediately when the gateway supports server-only
	 * confirmation (e.g. Stripe with a stored payment method).
	 */
	charge(params: ChargeParams): Promise<ChargeResult>;

	/** Issue a full or partial refund. */
	refund(params: RefundParams): Promise<RefundResult>;

	/** Poll payment status for a previously created transaction. */
	getPaymentStatus(transactionId: string): Promise<ChargeResult>;

	/**
	 * Verify that a webhook request is authentic (signature validation).
	 * @param rawBody  Raw, un-parsed request body Buffer.
	 * @param headers  HTTP headers map (lowercased keys).
	 * @returns true if the signature is valid, false otherwise.
	 */
	verifyWebhookSignature(rawBody: Buffer, headers: Record<string, string>): boolean;

	/**
	 * Parse a gateway webhook payload into a normalised event.
	 * @param payload  Parsed JSON body of the webhook.
	 * @param eventType  Raw event type string from the gateway header/body (optional).
	 */
	parseWebhookEvent(payload: Record<string, any>, eventType?: string): ParsedWebhookEvent;
}
