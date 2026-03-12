import { Injectable, Inject, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { WebhookRepository } from '../repositories/webhook.repository';
import { PaymentRepository } from '../repositories/payment.repository';
import { PaymentWebhook } from '../entities/payment-webhook.entity';
import { NotFoundException } from '../../common/exceptions/http.exceptions';

@Injectable()
export class WebhookService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
    private readonly webhookRepository: WebhookRepository,
    private readonly paymentRepository: PaymentRepository,
  ) {}

  async handleWebhook(gateway: string, payload: Record<string, any>): Promise<PaymentWebhook> {
    this.logger.log(`Received webhook from ${gateway}`, 'WebhookService');

    // Store webhook
    const webhook = await this.webhookRepository.createWebhook(gateway, payload);

    // Process webhook asynchronously (in production, this would be a background job)
    await this.processWebhook(webhook);

    return webhook;
  }

  private async processWebhook(webhook: PaymentWebhook): Promise<void> {
    try {
      this.logger.log(`Processing webhook ${webhook.id}`, 'WebhookService');

      // In production, different gateways would have different payload structures
      // This is a simplified example
      const { paymentId, status, transactionId } = webhook.payload;

      if (paymentId) {
        const payment = await this.paymentRepository.getPaymentById(paymentId);
        if (payment) {
          await this.paymentRepository.updatePaymentStatus(
            paymentId,
            status || 'completed',
            transactionId,
          );
          this.logger.log(`Updated payment ${paymentId} from webhook`, 'WebhookService');
        }
      }

      // Mark webhook as processed
      await this.webhookRepository.markWebhookAsProcessed(webhook.id);
      this.logger.log(`Webhook ${webhook.id} processed successfully`, 'WebhookService');
    } catch (error) {
      this.logger.error(`Failed to process webhook ${webhook.id}: ${error.message}`, 'WebhookService');
      throw error;
    }
  }

  async getWebhookById(id: string): Promise<PaymentWebhook> {
    this.logger.log(`Fetching webhook ${id}`, 'WebhookService');
    const webhook = await this.webhookRepository.getWebhookById(id);
    if (!webhook) {
      throw new NotFoundException('Webhook not found');
    }
    return webhook;
  }

  async getUnprocessedWebhooks(): Promise<PaymentWebhook[]> {
    this.logger.log('Fetching unprocessed webhooks', 'WebhookService');
    return this.webhookRepository.getUnprocessedWebhooks();
  }
}
