import { Injectable, Logger } from "@nestjs/common";
import {
	IGatewayAdapter,
	ChargeParams,
	ChargeResult,
	RefundParams,
	RefundResult,
	ParsedWebhookEvent,
} from "../interfaces/gateway-adapter.interface";

/**
 * MockAdapter
 *
 * Deterministic mock gateway for development and testing.
 * All operations succeed immediately without any external calls.
 * Always returns a fake transaction ID and "succeeded" status.
 *
 * Activated when PAYMENT_GATEWAY=mock (or when the selected gateway
 * credentials are missing and PaymentGatewayService falls back to mock).
 */
@Injectable()
export class MockAdapter implements IGatewayAdapter {
	private readonly logger = new Logger(MockAdapter.name);
	readonly gatewayName = "mock";

	async charge(params: ChargeParams): Promise<ChargeResult> {
		const transactionId = `txn_mock_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
		this.logger.warn(`[MOCK GATEWAY] Charging ${params.amount} ${params.currency} → ${transactionId}`);
		return {
			transactionId,
			status: "succeeded",
			gatewayResponse: { mock: true, amount: params.amount, currency: params.currency },
		};
	}

	async refund(params: RefundParams): Promise<RefundResult> {
		const refundId = `ref_mock_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
		this.logger.warn(`[MOCK GATEWAY] Refunding ${params.transactionId} → ${refundId}`);
		return { refundId, status: "succeeded" };
	}

	async getPaymentStatus(transactionId: string): Promise<ChargeResult> {
		return { transactionId, status: "succeeded", gatewayResponse: { mock: true } };
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	verifyWebhookSignature(_rawBody: Buffer, _headers: Record<string, string>): boolean {
		return true; // mock mode — always valid
	}

	parseWebhookEvent(payload: Record<string, any>): ParsedWebhookEvent {
		return {
			eventType: "payment.succeeded",
			transactionId: payload.transactionId ?? payload.transaction_id,
			paymentId: payload.paymentId ?? payload.payment_id,
		};
	}
}
