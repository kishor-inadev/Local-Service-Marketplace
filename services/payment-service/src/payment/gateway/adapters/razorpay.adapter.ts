import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as crypto from "crypto";
import {
  IGatewayAdapter,
  ChargeParams,
  ChargeResult,
  RefundParams,
  RefundResult,
  ParsedWebhookEvent,
} from "../interfaces/gateway-adapter.interface";

/**
 * RazorpayAdapter
 *
 * Backend-driven Razorpay payment flow:
 *   1. charge()  → creates a Razorpay Order (server-side).
 *                  The order_id + RAZORPAY_KEY_ID (public) are returned so
 *                  the frontend can open the Razorpay checkout widget.
 *                  Status is "pending" until webhook confirms capture.
 *   2. Webhook   → "payment.captured" event updates status to "succeeded".
 *   3. refund()  → creates a refund against the Razorpay payment ID.
 *
 * Required environment variables:
 *   RAZORPAY_KEY_ID        — rzp_live_... or rzp_test_...
 *   RAZORPAY_KEY_SECRET    — secret key
 *   RAZORPAY_WEBHOOK_SECRET — for webhook HMAC-SHA256 verification
 */
@Injectable()
export class RazorpayAdapter implements IGatewayAdapter {
  private readonly logger = new Logger(RazorpayAdapter.name);
  readonly gatewayName = "razorpay";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly razorpay: any;

  constructor(private readonly configService: ConfigService) {
    const keyId = this.configService.get<string>("RAZORPAY_KEY_ID", "");
    const keySecret = this.configService.get<string>("RAZORPAY_KEY_SECRET", "");
    if (keyId && keySecret) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const Razorpay = require("razorpay");
      this.razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
      this.logger.log("RazorpayAdapter initialised");
    } else {
      this.razorpay = null;
      this.logger.warn(
        "RazorpayAdapter: RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET missing — adapter disabled",
      );
    }
  }

  async charge(params: ChargeParams): Promise<ChargeResult> {
    // Razorpay amounts are in the smallest currency unit (paise for INR, cents for USD, etc.)
    const amountInSmallestUnit = Math.round(params.amount * 100);

    const order = await this.razorpay.orders.create({
      amount: amountInSmallestUnit,
      currency: params.currency.toUpperCase(),
      receipt: params.metadata?.job_id ?? `order_${Date.now()}`,
      notes: params.metadata ?? {},
    });

    this.logger.log(
      `Razorpay Order created: ${order.id}, status: ${order.status}`,
    );

    return {
      transactionId: order.id, // e.g. "order_xxx" — passed to frontend checkout widget
      status: "pending", // order created; awaiting client-side payment capture
      gatewayResponse: {
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        status: order.status,
        key_id: this.configService.get<string>("RAZORPAY_KEY_ID", ""),
      },
    };
  }

  /**
   * Refund a Razorpay payment.
   * @param params.transactionId  Razorpay payment ID (pay_xxx), NOT the order ID.
   */
  async refund(params: RefundParams): Promise<RefundResult> {
    const refundBody: Record<string, any> = { speed: "normal" };

    if (params.amount) {
      refundBody.amount = Math.round(params.amount * 100);
    }

    if (params.reason) {
      refundBody.notes = { reason: params.reason };
    }

    const refund = await this.razorpay.payments.refund(
      params.transactionId,
      refundBody,
    );

    this.logger.log(`Razorpay refund created: ${refund.id}`);
    return { refundId: refund.id, status: refund.status ?? "pending" };
  }

  async getPaymentStatus(transactionId: string): Promise<ChargeResult> {
    // transactionId could be an order_id or payment_id depending on how it was stored
    let payment: Record<string, any>;
    try {
      payment = await this.razorpay.payments.fetch(transactionId);
    } catch {
      // If fetch by payment_id fails, try fetching order payments
      const orderPayments =
        await this.razorpay.orders.fetchPayments(transactionId);
      payment = orderPayments?.items?.[0] ?? {};
    }

    const razorpayStatus = payment.status as string;
    const normalized =
      razorpayStatus === "captured"
        ? "succeeded"
        : razorpayStatus === "failed"
          ? "failed"
          : "pending";

    return { transactionId, status: normalized, gatewayResponse: payment };
  }

  verifyWebhookSignature(
    rawBody: Buffer,
    headers: Record<string, string>,
  ): boolean {
    const webhookSecret = this.configService.get<string>(
      "RAZORPAY_WEBHOOK_SECRET",
      "",
    );
    if (!webhookSecret) {
      this.logger.warn(
        "RAZORPAY_WEBHOOK_SECRET not set — skipping signature verification",
      );
      return true;
    }

    const receivedSignature = headers["x-razorpay-signature"] ?? "";
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    const isValid = crypto.timingSafeEqual(
      Buffer.from(receivedSignature, "hex"),
      Buffer.from(expectedSignature, "hex"),
    );

    if (!isValid) {
      this.logger.warn("Razorpay webhook signature mismatch");
    }
    return isValid;
  }

  parseWebhookEvent(payload: Record<string, any>): ParsedWebhookEvent {
    const event: string = payload.event ?? "";
    const paymentEntity: Record<string, any> =
      payload.payload?.payment?.entity ?? {};
    const refundEntity: Record<string, any> =
      payload.payload?.refund?.entity ?? {};

    switch (event) {
      case "payment.captured":
        return {
          eventType: "payment.succeeded",
          transactionId: paymentEntity.order_id, // order_id is what we stored as transactionId
          paymentId: paymentEntity.notes?.payment_id, // our application payment_id if stored in notes
          amount: paymentEntity.amount ? paymentEntity.amount / 100 : undefined,
          currency: paymentEntity.currency,
        };

      case "payment.failed":
        return {
          eventType: "payment.failed",
          transactionId: paymentEntity.order_id,
          paymentId: paymentEntity.notes?.payment_id,
        };

      case "refund.created":
      case "refund.processed":
        return {
          eventType: "refund.created",
          transactionId: refundEntity.payment_id,
        };

      default:
        return { eventType: "unknown" };
    }
  }
}
