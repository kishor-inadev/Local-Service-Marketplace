import { Injectable, Inject, LoggerService } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";
import { WebhookRepository } from "../repositories/webhook.repository";
import { PaymentRepository } from "../repositories/payment.repository";
import { PaymentWebhook } from "../entities/payment-webhook.entity";
import { NotFoundException } from "../../common/exceptions/http.exceptions";
import { NotificationClient } from "../../common/notification/notification.client";
import { UserClient } from "../../common/user/user.client";
import { PaymentGatewayService } from "../gateway/payment-gateway.service";

@Injectable()
export class WebhookService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    @InjectQueue("payment.webhook") private readonly webhookQueue: Queue,
    private readonly webhookRepository: WebhookRepository,
    private readonly paymentRepository: PaymentRepository,
    private readonly notificationClient: NotificationClient,
    private readonly userClient: UserClient,
    private readonly paymentGateway: PaymentGatewayService,
  ) { }

  /**
   * Handle an incoming webhook request.
   *
   * @param gateway   Gateway name (e.g. "stripe", "razorpay", "paypal").
   * @param rawBody   Raw, un-parsed request body Buffer for signature verification.
   * @param headers   HTTP headers map (lowercased keys).
   * @param payload   Parsed JSON body.
   */
  async handleWebhook(
    gateway: string,
    rawBody: Buffer,
    headers: Record<string, string>,
    payload: Record<string, any>,
  ): Promise<PaymentWebhook> {
    this.logger.log(`Received webhook from ${gateway}`, "WebhookService");

    // Verify webhook authenticity before storing or processing
    const isValid = this.paymentGateway.verifyWebhookSignature(
      gateway,
      rawBody,
      headers,
    );
    if (!isValid) {
      this.logger.warn(
        `Webhook signature verification failed for gateway: ${gateway}`,
        "WebhookService",
      );
      throw new Error("Invalid webhook signature");
    }

    // Store raw webhook
    const webhook = await this.webhookRepository.createWebhook(
      gateway,
      payload,
    );

    // Enqueue async processing — returns immediately (non-blocking)
    await this.webhookQueue.add('process-webhook', {
      webhookId: webhook.id,
      gateway,
    });

    return webhook;
  }

  private async processWebhook(
    webhook: PaymentWebhook,
    gateway: string,
  ): Promise<void> {
    try {
      this.logger.log(
        `Processing webhook ${webhook.id} from ${gateway}`,
        "WebhookService",
      );

      // Normalise the event using the per-gateway parser
      const event = this.paymentGateway.parseWebhookEvent(
        gateway,
        webhook.payload,
      );
      this.logger.log(
        `Webhook ${webhook.id} parsed as "${event.eventType}", transactionId: ${event.transactionId}`,
        "WebhookService",
      );

      if (event.eventType === "unknown") {
        this.logger.log(
          `Unhandled webhook event type from ${gateway} — marking processed`,
          "WebhookService",
        );
        await this.webhookRepository.markWebhookAsProcessed(webhook.id);
        return;
      }

      // Look up payment by transaction ID (the gateway order/intent ID stored at creation)
      let payment = event.transactionId
        ? await this.paymentRepository.getPaymentByTransactionId(
          event.transactionId,
        )
        : null;

      // Fall back to application-level paymentId if present in metadata
      if (!payment && event.paymentId) {
        payment = await this.paymentRepository.getPaymentById(event.paymentId);
      }

      if (!payment) {
        this.logger.warn(
          `Webhook ${webhook.id}: no payment found for transactionId=${event.transactionId}, paymentId=${event.paymentId}`,
          "WebhookService",
        );
        await this.webhookRepository.markWebhookAsProcessed(webhook.id);
        return;
      }

      if (event.eventType === "payment.succeeded") {
        await this.paymentRepository.updatePaymentStatus(
          payment.id,
          "completed",
          event.transactionId,
        );
        this.logger.log(
          `Payment ${payment.id} marked completed via ${gateway} webhook`,
          "WebhookService",
        );

        // Send confirmation email
        const userEmail = await this.userClient.getUserEmail(payment.user_id);
        if (userEmail) {
          this.notificationClient
            .sendEmail({
              to: userEmail,
              template: "paymentReceived",
              variables: {
                amount: payment.amount,
                currency: payment.currency || "INR",
                transactionId: event.transactionId,
                serviceName: "Service",
              },
            })
            .catch((err: any) => {
              this.logger.warn(
                `Failed to send payment confirmation email: ${err.message}`,
                "WebhookService",
              );
            });
        }
      } else if (event.eventType === "payment.failed") {
        await this.paymentRepository.updatePaymentStatus(
          payment.id,
          "failed",
          event.transactionId,
        );
        this.logger.log(
          `Payment ${payment.id} marked failed via ${gateway} webhook`,
          "WebhookService",
        );

        // Send failure notification email
        const userEmail = await this.userClient.getUserEmail(payment.user_id);
        if (userEmail) {
          this.notificationClient
            .sendEmail({
              to: userEmail,
              template: "paymentReceived",
              variables: {
                amount: payment.amount,
                currency: payment.currency || "INR",
                transactionId: payment.transaction_id,
                serviceName: "Payment Failed",
                message:
                  "Your payment could not be processed. Please check your payment method and try again.",
              },
            })
            .catch((err: any) => {
              this.logger.warn(
                `Failed to send payment failure notification: ${err.message}`,
                "WebhookService",
              );
            });
        }
      } else if (event.eventType === "refund.created") {
        await this.paymentRepository.updatePaymentStatus(
          payment.id,
          "refunded",
          event.transactionId,
        );
        this.logger.log(
          `Payment ${payment.id} marked refunded via ${gateway} webhook`,
          "WebhookService",
        );
      }

      // Mark webhook as processed
      await this.webhookRepository.markWebhookAsProcessed(webhook.id);
      this.logger.log(
        `Webhook ${webhook.id} processed successfully`,
        "WebhookService",
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to process webhook ${webhook.id}: ${error.message}`,
        "WebhookService",
      );
      throw error;
    }
  }

  async getWebhookById(id: string): Promise<PaymentWebhook> {
    this.logger.log(`Fetching webhook ${id}`, "WebhookService");
    const webhook = await this.webhookRepository.getWebhookById(id);
    if (!webhook) {
      throw new NotFoundException("Webhook not found");
    }
    return webhook;
  }

  async getUnprocessedWebhooks(): Promise<PaymentWebhook[]> {
    this.logger.log("Fetching unprocessed webhooks", "WebhookService");
    return this.webhookRepository.getUnprocessedWebhooks();
  }
}
