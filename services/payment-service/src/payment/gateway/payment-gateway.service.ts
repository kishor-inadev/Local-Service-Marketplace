import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StripeAdapter } from './adapters/stripe.adapter';
import { RazorpayAdapter } from './adapters/razorpay.adapter';
import { PayPalAdapter } from './adapters/paypal.adapter';
import { MockAdapter } from './adapters/mock.adapter';
import { PayUbizAdapter } from './adapters/payubiz.adapter';
import { InstamojoAdapter } from './adapters/instamojo.adapter';
import {
  IGatewayAdapter,
  ChargeParams,
  ChargeResult,
  RefundParams,
  RefundResult,
  ParsedWebhookEvent,
} from './interfaces/gateway-adapter.interface';

export type SupportedGateway =
  | 'stripe'
  | 'razorpay'
  | 'paypal'
  | 'payubiz'
  | 'instamojo'
  | 'mock';

// Re-export interface types for consumers
export { ChargeParams, ChargeResult, RefundParams, RefundResult, ParsedWebhookEvent };

/**
 * PaymentGatewayService
 *
 * Multi-gateway orchestrator supporting:
 *   stripe    -- Stripe PaymentIntents API
 *   razorpay  -- Razorpay Orders API
 *   paypal    -- PayPal Orders REST API v2
 *   payubiz   -- PayU India hosted checkout
 *   instamojo -- Instamojo Payment Requests API
 *   mock      -- Deterministic in-memory mock (default for dev/CI)
 *
 * Two selection modes:
 *   A) Env-level default (PAYMENT_GATEWAY env var) -- used when no per-request
 *      override is provided.
 *   B) Per-request override via X-Payment-Gateway request header -- the
 *      controller passes the header value to chargeWith() so each payment can
 *      use a different gateway in the same deployment.
 */
@Injectable()
export class PaymentGatewayService implements OnModuleInit {
  private readonly logger = new Logger(PaymentGatewayService.name);
  private defaultAdapter: IGatewayAdapter;

  constructor(
    private readonly configService: ConfigService,
    private readonly stripeAdapter: StripeAdapter,
    private readonly razorpayAdapter: RazorpayAdapter,
    private readonly paypalAdapter: PayPalAdapter,
    private readonly mockAdapter: MockAdapter,
    private readonly payubizAdapter: PayUbizAdapter,
    private readonly instamojoAdapter: InstamojoAdapter,
  ) {}

  onModuleInit(): void {
    this.defaultAdapter = this.resolveDefaultAdapter();
    this.logger.log(`Default payment gateway: "${this.defaultAdapter.gatewayName}"`);
    this.logger.log(
      `Available gateways: stripe, razorpay, paypal, payubiz, instamojo, mock`,
    );
  }

  // ---------------------------------------------------------------------------
  // Default adapter resolution (env-based)
  // ---------------------------------------------------------------------------

  private resolveDefaultAdapter(): IGatewayAdapter {
    const requested = (
      this.configService.get<string>('PAYMENT_GATEWAY', 'mock') as string
    ).toLowerCase() as SupportedGateway;
    return this.getValidatedAdapter(requested);
  }

  /**
   * Resolve an adapter by name, falling back to mock if credentials are absent.
   */
  private getValidatedAdapter(name: string): IGatewayAdapter {
    switch (name.toLowerCase() as SupportedGateway) {
      case 'stripe': {
        const key = this.configService.get<string>('STRIPE_SECRET_KEY', '');
        if (!key || !key.startsWith('sk_')) {
          this.logger.warn(`[stripe] STRIPE_SECRET_KEY missing/invalid. Falling back to mock.`);
          return this.mockAdapter;
        }
        return this.stripeAdapter;
      }

      case 'razorpay': {
        const keyId = this.configService.get<string>('RAZORPAY_KEY_ID', '');
        const keySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET', '');
        if (!keyId || !keySecret) {
          this.logger.warn(`[razorpay] RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET missing. Falling back to mock.`);
          return this.mockAdapter;
        }
        return this.razorpayAdapter;
      }

      case 'paypal': {
        const clientId = this.configService.get<string>('PAYPAL_CLIENT_ID', '');
        const clientSecret = this.configService.get<string>('PAYPAL_CLIENT_SECRET', '');
        if (!clientId || !clientSecret) {
          this.logger.warn(`[paypal] PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET missing. Falling back to mock.`);
          return this.mockAdapter;
        }
        return this.paypalAdapter;
      }

      case 'payubiz': {
        const key = this.configService.get<string>('PAYU_KEY', '');
        const salt = this.configService.get<string>('PAYU_SALT', '');
        if (!key || !salt) {
          this.logger.warn(`[payubiz] PAYU_KEY / PAYU_SALT missing. Falling back to mock.`);
          return this.mockAdapter;
        }
        return this.payubizAdapter;
      }

      case 'instamojo': {
        const apiKey = this.configService.get<string>('INSTAMOJO_API_KEY', '');
        const authToken = this.configService.get<string>('INSTAMOJO_AUTH_TOKEN', '');
        if (!apiKey || !authToken) {
          this.logger.warn(`[instamojo] INSTAMOJO_API_KEY / INSTAMOJO_AUTH_TOKEN missing. Falling back to mock.`);
          return this.mockAdapter;
        }
        return this.instamojoAdapter;
      }

      default:
        return this.mockAdapter;
    }
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /** Name of the env-configured default gateway. */
  getActiveGatewayName(): string {
    return this.defaultAdapter.gatewayName;
  }

  /**
   * List of all supported gateway identifiers.
   * Used to validate the X-Payment-Gateway header value.
   */
  getSupportedGateways(): SupportedGateway[] {
    return ['stripe', 'razorpay', 'paypal', 'payubiz', 'instamojo', 'mock'];
  }

  /**
   * Charge using the ENV-configured default gateway.
   * Used when no X-Payment-Gateway header is provided.
   */
  async charge(params: ChargeParams): Promise<ChargeResult> {
    return this.chargeWith(this.defaultAdapter.gatewayName, params);
  }

  /**
   * Charge using a specific gateway (per-request override).
   *
   * @param gateway  Gateway name from X-Payment-Gateway header.
   *                 Falls back to mock if credentials are missing.
   * @param params   Charge parameters.
   */
  async chargeWith(gateway: string, params: ChargeParams): Promise<ChargeResult> {
    const adapter = this.getValidatedAdapter(gateway);
    this.logger.log(
      `[${adapter.gatewayName}] charge ${params.amount} ${params.currency}`,
    );
    return adapter.charge(params);
  }

  /** Issue a refund via the default gateway. */
  async refund(params: RefundParams): Promise<RefundResult> {
    return this.refundWith(this.defaultAdapter.gatewayName, params);
  }

  /** Issue a refund via a specific gateway. */
  async refundWith(gateway: string, params: RefundParams): Promise<RefundResult> {
    const adapter = this.getValidatedAdapter(gateway);
    this.logger.log(`[${adapter.gatewayName}] refunding ${params.transactionId}`);
    return adapter.refund(params);
  }

  /** Poll payment status via the default gateway. */
  async getPaymentStatus(transactionId: string): Promise<ChargeResult> {
    return this.defaultAdapter.getPaymentStatus(transactionId);
  }

  /** Verify webhook signature for a specific gateway. */
  verifyWebhookSignature(
    gateway: string,
    rawBody: Buffer,
    headers: Record<string, string>,
  ): boolean {
    return this.getAdapterByName(gateway).verifyWebhookSignature(rawBody, headers);
  }

  /** Parse a webhook payload for a specific gateway into a normalised event. */
  parseWebhookEvent(
    gateway: string,
    payload: Record<string, any>,
  ): ParsedWebhookEvent {
    return this.getAdapterByName(gateway).parseWebhookEvent(payload);
  }

  /** Whether the env-default gateway is the mock adapter. */
  isMockMode(): boolean {
    return this.defaultAdapter.gatewayName === 'mock';
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /** Return an adapter by name without credential validation (used for parsing/verification). */
  private getAdapterByName(name: string): IGatewayAdapter {
    switch (name.toLowerCase()) {
      case 'stripe':    return this.stripeAdapter;
      case 'razorpay':  return this.razorpayAdapter;
      case 'paypal':    return this.paypalAdapter;
      case 'payubiz':   return this.payubizAdapter;
      case 'instamojo': return this.instamojoAdapter;
      default:          return this.mockAdapter;
    }
  }
}
