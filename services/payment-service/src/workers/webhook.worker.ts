import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, LoggerService, OnModuleInit } from '@nestjs/common';
import { Job } from 'bullmq';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { WebhookRepository } from '../payment/repositories/webhook.repository';
import { PaymentRepository } from '../payment/repositories/payment.repository';
import { PaymentGatewayService } from '../payment/gateway/payment-gateway.service';

export interface ProcessWebhookJobData {
  webhookId: string;
  gateway: string;
}

@Processor('payment.webhook', {
  concurrency: parseInt(process.env.WORKER_CONCURRENCY || '5', 10),
})
export class WebhookWorker extends WorkerHost implements OnModuleInit {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly webhookRepository: WebhookRepository,
    private readonly paymentRepository: PaymentRepository,
    private readonly paymentGateway: PaymentGatewayService,
  ) {
    super();
  }

  async onModuleInit(): Promise<void> {
    // No repeatable jobs — webhooks arrive on demand
  }

  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case 'process-webhook':
        return this.handleProcessWebhook(job as Job<ProcessWebhookJobData>);
      default:
        throw new Error(`Unknown job name: ${job.name}`);
    }
  }

  private async handleProcessWebhook(job: Job<ProcessWebhookJobData>): Promise<void> {
    const { webhookId, gateway } = job.data;
    this.logger.log(`Processing webhook ${webhookId} from ${gateway}`, 'WebhookWorker');

    const webhook = await this.webhookRepository.getWebhookById(webhookId);
    if (!webhook) {
      this.logger.warn(`Webhook ${webhookId} not found — skipping`, 'WebhookWorker');
      return;
    }

    try {
      const event = this.paymentGateway.parseWebhookEvent(gateway, webhook.payload);
      this.logger.log(`Parsed webhook event: ${event.type}`, 'WebhookWorker');

      switch (event.type) {
        case 'payment.succeeded':
          await this.paymentRepository.updatePaymentStatus(event.paymentId, 'completed', event.transactionId);
          break;
        case 'payment.failed':
          await this.paymentRepository.updatePaymentStatus(event.paymentId, 'failed', null);
          break;
        case 'refund.succeeded':
          await this.paymentRepository.updatePaymentStatus(event.paymentId, 'refunded', null);
          break;
        default:
          this.logger.log(`Unhandled webhook event type: ${event.type}`, 'WebhookWorker');
      }

      await this.webhookRepository.markProcessed(webhookId);
      this.logger.log(`Webhook ${webhookId} processed successfully`, 'WebhookWorker');
    } catch (error) {
      this.logger.error(`Webhook ${webhookId} processing failed: ${error.message}`, error.stack, 'WebhookWorker');
      await this.webhookRepository.markFailed(webhookId, error.message);
      throw error;
    }
  }
}
