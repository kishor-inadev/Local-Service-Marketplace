import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
	IGatewayAdapter,
	ChargeParams,
	ChargeResult,
	RefundParams,
	RefundResult,
	ParsedWebhookEvent,
} from "../interfaces/gateway-adapter.interface";

/**
 * StripeAdapter
 *
 * Backend-driven Stripe payment flow:
 *   1. charge()  → creates a PaymentIntent with automatic_payment_methods
 *                  (no redirect). The PaymentIntent client_secret is
 *                  returned in gatewayResponse for the frontend Stripe SDK.
 *   2. Webhook   → "payment_intent.succeeded" / "payment_intent.payment_failed"
 *   3. refund()  → creates a Refund against the PaymentIntent server-side.
 *
 * Required environment variables:
 *   STRIPE_SECRET_KEY      — sk_live_... or sk_test_...
 *   STRIPE_WEBHOOK_SECRET  — whsec_... (optional, skipped if absent for dev)
 */
@Injectable()
export class StripeAdapter implements IGatewayAdapter {
	private readonly logger = new Logger(StripeAdapter.name);
	readonly gatewayName = "stripe";

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private readonly stripe: any;

	constructor(private readonly configService: ConfigService) {
		const secretKey = this.configService.get<string>("STRIPE_SECRET_KEY", "");
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const StripeSDK = require("stripe");
		this.stripe = new StripeSDK(secretKey, { apiVersion: "2025-05-28.basil" });
		this.logger.log("StripeAdapter initialised");
	}

	async charge(params: ChargeParams): Promise<ChargeResult> {
		const intentParams: Record<string, any> = {
			amount: Math.round(params.amount * 100), // convert to cents
			currency: params.currency.toLowerCase(),
			description: params.description,
			metadata: params.metadata ?? {},
			// Backend-only: allow all automatic payment methods, disallow server-side redirects
			automatic_payment_methods: { enabled: true, allow_redirects: "never" },
		};

		if (params.customerEmail) {
			intentParams.receipt_email = params.customerEmail;
		}

		const intent = await this.stripe.paymentIntents.create(intentParams);

		this.logger.log(`Stripe PaymentIntent created: ${intent.id}, status: ${intent.status}`);

		return {
			transactionId: intent.id,
			status: intent.status === "succeeded" ? "succeeded" : "pending",
			gatewayResponse: { id: intent.id, status: intent.status, client_secret: intent.client_secret },
		};
	}

	async refund(params: RefundParams): Promise<RefundResult> {
		const refundParams: Record<string, any> = {
			payment_intent: params.transactionId,
			reason: (params.reason as any) ?? "requested_by_customer",
		};

		if (params.amount) {
			refundParams.amount = Math.round(params.amount * 100);
		}

		const refund = await this.stripe.refunds.create(refundParams);

		this.logger.log(`Stripe refund created: ${refund.id}`);
		return { refundId: refund.id, status: refund.status ?? "pending" };
	}

	async getPaymentStatus(transactionId: string): Promise<ChargeResult> {
		const intent = await this.stripe.paymentIntents.retrieve(transactionId);
		return {
			transactionId: intent.id,
			status: intent.status === "succeeded" ? "succeeded" : "pending",
			gatewayResponse: { id: intent.id, status: intent.status },
		};
	}

	verifyWebhookSignature(rawBody: Buffer, headers: Record<string, string>): boolean {
		const webhookSecret = this.configService.get<string>("STRIPE_WEBHOOK_SECRET", "");
		if (!webhookSecret) {
			this.logger.warn("STRIPE_WEBHOOK_SECRET not set — skipping signature verification");
			return true;
		}
		try {
			this.stripe.webhooks.constructEvent(rawBody, headers["stripe-signature"], webhookSecret);
			return true;
		} catch (err) {
			this.logger.warn(`Stripe webhook signature invalid: ${err?.message}`);
			return false;
		}
	}

	parseWebhookEvent(payload: Record<string, any>): ParsedWebhookEvent {
		const type: string = payload.type ?? "";
		const obj: Record<string, any> = payload.data?.object ?? {};

		switch (type) {
			case "payment_intent.succeeded":
				return {
					eventType: "payment.succeeded",
					transactionId: obj.id,
					paymentId: obj.metadata?.payment_id,
					amount: obj.amount ? obj.amount / 100 : undefined,
					currency: obj.currency,
				};

			case "payment_intent.payment_failed":
				return { eventType: "payment.failed", transactionId: obj.id, paymentId: obj.metadata?.payment_id };

			case "charge.refunded":
				return { eventType: "refund.created", transactionId: obj.payment_intent };

			default:
				return { eventType: "unknown" };
		}
	}
}
