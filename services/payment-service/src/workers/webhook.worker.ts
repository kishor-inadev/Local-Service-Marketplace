import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Inject, LoggerService, OnModuleInit, Optional } from '@nestjs/common';
import { Job } from 'bullmq';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { WebhookRepository } from '../payment/repositories/webhook.repository';
import { PaymentRepository } from '../payment/repositories/payment.repository';
import { PaymentGatewayService } from '../payment/gateway/payment-gateway.service';
import { DeadLetterQueueService } from '../common/dlq/dead-letter-queue.service';

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
    @Optional() private readonly dlqService?: DeadLetterQueueService,
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
      this.logger.log(`Parsed webhook event: ${event.eventType}`, 'WebhookWorker');

      switch (event.eventType) {
        case 'payment.succeeded':
          await this.paymentRepository.updatePaymentStatus(event.paymentId, 'completed', event.transactionId);
          break;
        case 'payment.failed':
          await this.paymentRepository.updatePaymentStatus(event.paymentId, 'failed', null);
          break;
        case 'refund.created':
          await this.paymentRepository.updatePaymentStatus(event.paymentId, 'refunded', null);
          break;
        default:
          this.logger.log(`Unhandled webhook event type: ${event.eventType}`, 'WebhookWorker');
      }

      await this.webhookRepository.markProcessed(webhookId);
      this.logger.log(`Webhook ${webhookId} processed successfully`, 'WebhookWorker');
    } catch (error: any) {
      this.logger.error(`Webhook ${webhookId} processing failed: ${error.message}`, error.stack, 'WebhookWorker');
      await this.webhookRepository.markFailed(webhookId, error.message);

      // Capture in DLQ if max retries reached
      if (this.dlqService && job.attemptsMade >= 3) {
        await this.dlqService.captureFailedJob('payment.webhook', job, error);
      }

      throw error;
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // Worker lifecycle hooks
  // ─────────────────────────────────────────────────────────────────

  @OnWorkerEvent('active')
  onActive(job: Job): void {
    this.logger.log(`Job "${job.name}/${job.id}" started (attempt ${job.attemptsMade + 1})`, 'WebhookWorker');
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job): void {
    this.logger.log(`Job "${job.name}/${job.id}" completed`, 'WebhookWorker');
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job | undefined, error: Error): void {
    this.logger.error(
      `Job "${job?.name ?? 'unknown'}/${job?.id ?? '?'}" failed (attempt ${job?.attemptsMade ?? 0}): ${error.message}`,
      error.stack,
      'WebhookWorker',
    );
  }

  @OnWorkerEvent('error')
  onError(error: Error): void {
    this.logger.error(`Worker error: ${error.message}`, error.stack, 'WebhookWorker');
  }

  @OnWorkerEvent('stalled')
  onStalled(jobId: string): void {
    this.logger.warn(`Job ${jobId} stalled and will be requeued`, 'WebhookWorker');
  }
}
