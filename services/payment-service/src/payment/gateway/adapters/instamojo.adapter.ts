import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios, { AxiosInstance } from "axios";
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
 * InstamojoAdapter
 *
 * Backend-driven Instamojo payment flow (REST API v2):
 *   1. charge()  → Creates an Instamojo Payment Request.
 *                  Returns the payment request ID as transactionId and the
 *                  hosted `longurl` (redirect URL) in gatewayResponse so the
 *                  frontend can redirect or open the Instamojo hosted page.
 *                  Status is "pending" until Instamojo calls your webhook.
 *   2. Webhook   → Instamojo POSTs payment details to your webhook URL.
 *                  Verified via MAC (HMAC-SHA1 over sorted fields).
 *   3. refund()  → POST /v2/refunds/ to create a refund request.
 *
 * Required environment variables:
 *   INSTAMOJO_API_KEY        — from Instamojo developer dashboard
 *   INSTAMOJO_AUTH_TOKEN     — from Instamojo developer dashboard
 *   INSTAMOJO_SALT           — for webhook HMAC-SHA1 MAC verification
 *   INSTAMOJO_WEBHOOK_URL    — URL where Instamojo should POST payment events
 *   INSTAMOJO_REDIRECT_URL   — URL to redirect after payment completion
 *   INSTAMOJO_API_URL        — https://www.instamojo.com (production)
 *                              or https://test.instamojo.com (test/sandbox)
 */
@Injectable()
export class InstamojoAdapter implements IGatewayAdapter {
  private readonly logger = new Logger(InstamojoAdapter.name);
  readonly gatewayName = "instamojo";

  private readonly http: AxiosInstance;

  constructor(private readonly configService: ConfigService) {
    const apiUrl = this.configService.get<string>(
      "INSTAMOJO_API_URL",
      "https://test.instamojo.com",
    );
    const apiKey = this.configService.get<string>("INSTAMOJO_API_KEY", "");
    const authToken = this.configService.get<string>(
      "INSTAMOJO_AUTH_TOKEN",
      "",
    );

    this.http = axios.create({
      baseURL: apiUrl,
      timeout: this.configService.get<number>("REQUEST_TIMEOUT_MS", 72000),
      headers: {
        "X-Api-Key": apiKey,
        "X-Auth-Token": authToken,
        "Content-Type": "application/json",
      },
    });
    this.logger.log(`InstamojoAdapter initialised (${apiUrl})`);
  }

  async charge(params: ChargeParams): Promise<ChargeResult> {
    const webhookUrl = this.configService.get<string>(
      "INSTAMOJO_WEBHOOK_URL",
      "",
    );
    const redirectUrl = this.configService.get<string>(
      "INSTAMOJO_REDIRECT_URL",
      "",
    );

    const body: Record<string, any> = {
      purpose:
        params.description ?? params.metadata?.job_id ?? "Service Payment",
      amount: params.amount.toFixed(2),
      currency: (params.currency ?? "INR").toUpperCase(),
      buyer_name: params.customerName ?? "Customer",
      email: params.customerEmail ?? "",
      phone: "", // optional — can be added to metadata if needed
      send_email: false,
      send_sms: false,
      allow_repeated_payments: false,
    };

    if (webhookUrl) body.webhook = webhookUrl;
    if (redirectUrl) body.redirect_url = redirectUrl;

    const response = await this.http.post("/api/1.1/payment-requests/", body);
    const pr = response.data?.payment_request as Record<string, any>;

    this.logger.log(`Instamojo Payment Request created: ${pr.id}`);

    return {
      transactionId: pr.id, // e.g. "e8a7fef52xxxxxx"
      status: "pending", // awaiting customer to visit longurl
      gatewayResponse: {
        id: pr.id,
        longurl: pr.longurl, // hosted checkout page URL for the customer
        status: pr.status,
        amount: pr.amount,
        currency: pr.currency,
      },
    };
  }

  /**
   * Create a refund request on Instamojo.
   * @param params.transactionId  Instamojo payment_id (pay_xxx), NOT the request ID.
   */
  async refund(params: RefundParams): Promise<RefundResult> {
    const body: Record<string, any> = {
      payment: params.transactionId,
      type: "RFD", // Refund initiated by seller
      body: params.reason ?? "Refund requested by customer",
    };

    if (params.amount) {
      body.refund_amount = params.amount.toFixed(2);
    }

    const response = await this.http.post("/api/1.1/refunds/", body);
    const refund = response.data?.refund as Record<string, any>;

    this.logger.log(`Instamojo refund created: ${refund.id}`);
    return {
      refundId: refund.id,
      status: (refund.status ?? "pending").toLowerCase(),
    };
  }

  async getPaymentStatus(transactionId: string): Promise<ChargeResult> {
    // transactionId here is the payment_request_id
    const response = await this.http.get(
      `/api/1.1/payment-requests/${transactionId}/`,
    );
    const pr = response.data?.payment_request as Record<string, any>;
    const payments: any[] = pr?.payments ?? [];

    // Check if any linked payment is completed
    const completed = payments.find(
      (p: any) => (p.status ?? "").toLowerCase() === "credit",
    );

    return {
      transactionId: completed?.id ?? transactionId,
      status: completed ? "succeeded" : "pending",
      gatewayResponse: pr,
    };
  }

  /**
   * Verify Instamojo webhook via MAC (HMAC-SHA1).
   *
   * Instamojo webhook payload fields:
   *   mac, payment_id, status, payment_request_id, amount, fees, ...
   *
   * MAC formula (HMAC-SHA1, key = INSTAMOJO_SALT):
   *   Pipe-join sorted field values (excluding 'mac'):
   *   HMAC-SHA1(<sorted values joined by '|'>, SALT)
   */
  verifyWebhookSignature(
    rawBody: Buffer,
    _headers: Record<string, string>,
  ): boolean {
    const salt = this.configService.get<string>("INSTAMOJO_SALT", "");
    if (!salt) {
      this.logger.warn(
        "INSTAMOJO_SALT not set — skipping webhook verification",
      );
      return true;
    }

    try {
      // Parse URL-encoded or JSON body
      let params: Record<string, string> = {};
      const bodyStr = rawBody.toString();
      if (bodyStr.startsWith("{")) {
        params = JSON.parse(bodyStr);
      } else {
        const usp = new URLSearchParams(bodyStr);
        usp.forEach((v, k) => {
          params[k] = v;
        });
      }

      const receivedMac = params.mac ?? "";
      const { mac: _mac, ...rest } = params; // eslint-disable-line @typescript-eslint/no-unused-vars

      // Sort keys alphabetically and join values
      const message = Object.keys(rest)
        .sort()
        .map((k) => rest[k])
        .join("|");

      const expectedMac = crypto
        .createHmac("sha1", salt)
        .update(message)
        .digest("hex");

      const isValid = crypto.timingSafeEqual(
        Buffer.from(receivedMac.toLowerCase()),
        Buffer.from(expectedMac.toLowerCase()),
      );

      if (!isValid) {
        this.logger.warn("Instamojo webhook MAC mismatch");
      }
      return isValid;
    } catch (err: any) {
      this.logger.warn(`Instamojo webhook verification error: ${err?.message}`);
      return false;
    }
  }

  parseWebhookEvent(payload: Record<string, any>): ParsedWebhookEvent {
    const status = (payload.status ?? "").toLowerCase();

    // "Credit" means successful payment in Instamojo's terminology
    if (status === "credit") {
      return {
        eventType: "payment.succeeded",
        transactionId: payload.payment_request_id, // the request ID we stored
        paymentId: payload.payment_request_id,
        amount: payload.amount ? parseFloat(payload.amount) : undefined,
        currency: "INR",
      };
    }

    if (status === "failed" || status === "failure") {
      return {
        eventType: "payment.failed",
        transactionId: payload.payment_request_id,
      };
    }

    if (status === "refunded") {
      return { eventType: "refund.created", transactionId: payload.payment_id };
    }

    return { eventType: "unknown" };
  }
}
