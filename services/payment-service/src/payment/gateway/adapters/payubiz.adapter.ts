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
 * PayUbizAdapter (PayU India)
 *
 * Backend-driven PayU payment flow:
 *   1. charge()  → Generates a signed payment request hash. Returns the
 *                  transactionId (txnid) + hash + all required fields so the
 *                  frontend can POST to PayU's hosted checkout page:
 *                    Production: https://secure.payu.in/_payment
 *                    Test:       https://test.payu.in/_payment
 *                  Status is "pending" until PayU posts to surl/furl.
 *   2. Webhook   → PayU POSTs to your surl/furl with txnid + status + mihpayid.
 *                  Verified via reverse-hash check.
 *   3. refund()  → PayU refund API: POST to cancellation API.
 *
 * Required environment variables:
 *   PAYU_KEY             — Merchant key from PayU dashboard
 *   PAYU_SALT            — Salt from PayU dashboard
 *   PAYU_SUCCESS_URL     — Your backend success callback URL
 *   PAYU_FAILURE_URL     — Your backend failure callback URL
 *   PAYU_API_URL         — https://secure.payu.in (production)
 *                          or https://test.payu.in (test/sandbox)
 *
 * Hash formula (SHA512):
 *   key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT
 *
 * Reverse hash (webhook verification, SHA512):
 *   SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key
 */
@Injectable()
export class PayUbizAdapter implements IGatewayAdapter {
  private readonly logger = new Logger(PayUbizAdapter.name);
  readonly gatewayName = "payubiz";

  private readonly http: AxiosInstance;

  constructor(private readonly configService: ConfigService) {
    const apiUrl = this.configService.get<string>(
      "PAYU_API_URL",
      "https://test.payu.in",
    );
    this.http = axios.create({
      baseURL: apiUrl,
      timeout: this.configService.get<number>("REQUEST_TIMEOUT_MS", 72000),
    });
    this.logger.log(`PayUbizAdapter initialised (${apiUrl})`);
  }

  async charge(params: ChargeParams): Promise<ChargeResult> {
    const key = this.configService.get<string>("PAYU_KEY", "");
    const salt = this.configService.get<string>("PAYU_SALT", "");
    const successUrl = this.configService.get<string>("PAYU_SUCCESS_URL", "");
    const failureUrl = this.configService.get<string>("PAYU_FAILURE_URL", "");

    const txnid = `TXN_${Date.now()}_${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    const amount = params.amount.toFixed(2);
    const productinfo =
      params.description ?? params.metadata?.job_id ?? "Service Payment";
    const firstname = params.customerName ?? "Customer";
    const email = params.customerEmail ?? "";

    // Build hash: key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT
    const hashString = [
      key,
      txnid,
      amount,
      productinfo,
      firstname,
      email,
      "", // udf1
      "", // udf2
      "", // udf3
      "", // udf4
      "", // udf5
      "",
      "",
      "",
      "",
      "",
      salt,
    ].join("|");

    const hash = crypto.createHash("sha512").update(hashString).digest("hex");

    this.logger.log(`PayU transaction created: ${txnid}`);

    return {
      transactionId: txnid,
      status: "pending", // PayU is always redirect-based; status confirmed via webhook
      gatewayResponse: {
        txnid,
        key,
        amount,
        productinfo,
        firstname,
        email,
        hash,
        surl: successUrl,
        furl: failureUrl,
        // The frontend must POST these fields to PAYU_API_URL + "/_payment"
        payuAction: `${this.configService.get<string>("PAYU_API_URL", "https://test.payu.in")}/_payment`,
      },
    };
  }

  /**
   * Issue a refund via PayU cancellation API.
   * @param params.transactionId  PayU mihpayid (returned in webhook, not txnid).
   */
  async refund(params: RefundParams): Promise<RefundResult> {
    const key = this.configService.get<string>("PAYU_KEY", "");
    const salt = this.configService.get<string>("PAYU_SALT", "");

    // PayU refund hash: key|command|var1|salt  (command = cancel_refund_transaction)
    const command = "cancel_refund_transaction";
    const var1 = params.transactionId; // mihpayid
    const hashString = `${key}|${command}|${var1}|${salt}`;
    const hash = crypto.createHash("sha512").update(hashString).digest("hex");

    const body = new URLSearchParams({ key, command, var1, hash });

    const response = await this.http.post(
      "/merchant/postservice.php?form=2",
      body.toString(),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      },
    );

    const data = response.data as Record<string, any>;
    this.logger.log(`PayU refund response: ${JSON.stringify(data)}`);

    const refundId =
      data?.mihpayid ?? data?.refundId ?? `ref_payu_${Date.now()}`;
    const status = (data?.status ?? "pending").toLowerCase();
    return { refundId, status };
  }

  async getPaymentStatus(transactionId: string): Promise<ChargeResult> {
    const key = this.configService.get<string>("PAYU_KEY", "");
    const salt = this.configService.get<string>("PAYU_SALT", "");

    // Verify payment API: command = verify_payment
    const command = "verify_payment";
    const hashString = `${key}|${command}|${transactionId}|${salt}`;
    const hash = crypto.createHash("sha512").update(hashString).digest("hex");

    const body = new URLSearchParams({
      key,
      command,
      var1: transactionId,
      hash,
    });
    const response = await this.http.post(
      "/merchant/postservice.php?form=2",
      body.toString(),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      },
    );

    const data = response.data as Record<string, any>;
    const txn = data?.transaction_details?.[transactionId];
    const payuStatus: string = (txn?.status ?? "").toLowerCase();

    const normalized =
      payuStatus === "success"
        ? "succeeded"
        : payuStatus === "failure"
          ? "failed"
          : "pending";

    return { transactionId, status: normalized, gatewayResponse: data };
  }

  /**
   * Verify the reverse hash posted by PayU to surl/furl.
   * Webhook body is URL-encoded (from PayU POST).
   *
   * Reverse hash formula (SHA512):
   *   SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key
   */
  verifyWebhookSignature(
    rawBody: Buffer,
    headers: Record<string, string>,
  ): boolean {
    const salt = this.configService.get<string>("PAYU_SALT", "");
    if (!salt) {
      this.logger.warn(
        "PAYU_SALT not set — skipping PayU webhook verification",
      );
      return true;
    }

    try {
      const params = new URLSearchParams(rawBody.toString());
      const get = (k: string) => params.get(k) ?? "";

      const reverseHashString = [
        salt,
        get("status"),
        "",
        "",
        "",
        "",
        "", // udf5..udf1 reversed
        get("udf5"),
        get("udf4"),
        get("udf3"),
        get("udf2"),
        get("udf1"),
        get("email"),
        get("firstname"),
        get("productinfo"),
        get("amount"),
        get("txnid"),
        get("key"),
      ].join("|");

      const expectedHash = crypto
        .createHash("sha512")
        .update(reverseHashString)
        .digest("hex");
      const receivedHash = get("hash");

      const isValid = expectedHash === receivedHash;
      if (!isValid) {
        this.logger.warn("PayU webhook reverse hash mismatch");
      }
      return isValid;
    } catch (err) {
      this.logger.warn(`PayU webhook verification error: ${err?.message}`);
      return false;
    }
  }

  parseWebhookEvent(payload: Record<string, any>): ParsedWebhookEvent {
    const status = (payload.status ?? "").toLowerCase();
    const txnid: string = payload.txnid ?? "";
    const mihpayid: string = payload.mihpayid ?? "";

    if (status === "success") {
      return {
        eventType: "payment.succeeded",
        transactionId: txnid,
        // mihpayid is the PayU-side transaction ID; we use txnid (our id) as transactionId
        paymentId: payload.udf1 ?? undefined, // store our payment_id in udf1 if needed
        amount: payload.amount ? parseFloat(payload.amount) : undefined,
        currency: "INR", // PayU India always settles in INR
        // Store mihpayid for refund operations (it's the PayU payment ID needed for refunds)
        ...(mihpayid && { gatewayPaymentId: mihpayid }),
      };
    }

    if (status === "failure" || status === "failed") {
      return {
        eventType: "payment.failed",
        transactionId: txnid,
        paymentId: payload.udf1 ?? undefined,
      };
    }

    return { eventType: "unknown" };
  }
}
