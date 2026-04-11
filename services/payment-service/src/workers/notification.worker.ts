import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Inject, LoggerService, OnModuleInit } from '@nestjs/common';
import { Job } from 'bullmq';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { NotificationClient } from '../common/notification/notification.client';
import { UserClient } from '../common/user/user.client';

export interface NotifyPaymentCompletedJobData {
  paymentId: string;
  userId: string;
  amount: number;
  currency: string;
  transactionId: string;
}

export interface NotifyRefundProcessedJobData {
  refundId: string;
  paymentId: string;
  userId: string;
  amount: number;
  currency: string;
}

export interface NotifyPaymentFailedJobData {
  paymentId: string;
  userId: string;
  amount: number;
  currency: string;
  reason?: string;
}

export interface NotifyCardSavedJobData {
  userId: string;
  cardBrand: string;
  lastFour: string;
}

export interface NotifyCardDeletedJobData {
  userId: string;
  cardBrand: string;
  lastFour: string;
}

@Processor('payment.notification', {
  concurrency: parseInt(process.env.WORKER_CONCURRENCY || '5', 10),
})
export class PaymentNotificationWorker extends WorkerHost implements OnModuleInit {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly notificationClient: NotificationClient,
    private readonly userClient: UserClient,
  ) {
    super();
  }

  async onModuleInit(): Promise<void> {
    // No repeatable jobs — notifications are enqueued per event
  }

  async process(job: Job<any, any, string>): Promise<any> {
    try {
      switch (job.name) {
        case 'notify-payment-completed':
          return this.handlePaymentCompleted(job as Job<NotifyPaymentCompletedJobData>);
        case 'notify-refund-processed':
          return this.handleRefundProcessed(job as Job<NotifyRefundProcessedJobData>);
        case 'notify-payment-failed':
          return this.handlePaymentFailed(job as Job<NotifyPaymentFailedJobData>);
        case 'notify-card-saved':
          return this.handleCardSaved(job as Job<NotifyCardSavedJobData>);
        case 'notify-card-deleted':
          return this.handleCardDeleted(job as Job<NotifyCardDeletedJobData>);
        default:
          throw new Error(`Unknown job name: ${job.name}`);
      }
    } catch (error: any) {
      const err = error as Error;
      this.logger.error(`Job "${job.name}/${job.id}" threw: ${err.message}`, err.stack, 'PaymentNotificationWorker');
      throw error;
    }
  }

  private async handlePaymentCompleted(job: Job<NotifyPaymentCompletedJobData>): Promise<void> {
    const { userId, amount, currency, transactionId } = job.data;
    const userEmail = await this.userClient.getUserEmail(userId);
    if (!userEmail) return;

    await this.notificationClient.sendEmail({
      to: userEmail,
      template: 'paymentReceived',
      variables: { amount, currency, transactionId, serviceName: 'Service' },
    });
    this.logger.log(`Payment confirmation sent to user ${userId}`, 'PaymentNotificationWorker');
  }

  private async handleRefundProcessed(job: Job<NotifyRefundProcessedJobData>): Promise<void> {
    const { userId, amount, currency, paymentId } = job.data;
    const userEmail = await this.userClient.getUserEmail(userId);
    if (!userEmail) return;

    await this.notificationClient.sendEmail({
      to: userEmail,
      template: 'refundProcessed',
      variables: { amount, currency, paymentId },
    });
    this.logger.log(`Refund notification sent to user ${userId}`, 'PaymentNotificationWorker');
  }

  private async handlePaymentFailed(job: Job<NotifyPaymentFailedJobData>): Promise<void> {
    const { userId, amount, currency, reason } = job.data;
    const userEmail = await this.userClient.getUserEmail(userId);
    if (!userEmail) return;

    await this.notificationClient.sendEmail({
      to: userEmail,
      template: 'paymentFailed',
      variables: { amount, currency, reason: reason ?? 'Unknown error' },
    });
    this.logger.log(`Payment failure notification sent to user ${userId}`, 'PaymentNotificationWorker');
  }

  private async handleCardSaved(job: Job<NotifyCardSavedJobData>): Promise<void> {
    const { userId, cardBrand, lastFour } = job.data;
    const userEmail = await this.userClient.getUserEmail(userId);
    if (!userEmail) return;

    await this.notificationClient.sendEmail({
      to: userEmail,
      template: 'cardSaved',
      variables: { cardBrand, lastFour },
    });
    this.logger.log(`Card-saved notification sent to user ${userId}`, 'PaymentNotificationWorker');
  }

  private async handleCardDeleted(job: Job<NotifyCardDeletedJobData>): Promise<void> {
    const { userId, cardBrand, lastFour } = job.data;
    const userEmail = await this.userClient.getUserEmail(userId);
    if (!userEmail) return;

    await this.notificationClient.sendEmail({
      to: userEmail,
      template: 'cardDeleted',
      variables: { cardBrand, lastFour },
    });
    this.logger.log(`Card-deleted notification sent to user ${userId}`, 'PaymentNotificationWorker');
  }

  // ─────────────────────────────────────────────────────────────────
  // Worker lifecycle hooks
  // ─────────────────────────────────────────────────────────────────

  @OnWorkerEvent('active')
  onActive(job: Job): void {
    this.logger.log(`Job "${job.name}/${job.id}" started (attempt ${job.attemptsMade + 1})`, 'PaymentNotificationWorker');
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job): void {
    this.logger.log(`Job "${job.name}/${job.id}" completed`, 'PaymentNotificationWorker');
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job | undefined, error: Error): void {
    this.logger.error(
      `Job "${job?.name ?? 'unknown'}/${job?.id ?? '?'}" failed (attempt ${job?.attemptsMade ?? 0}): ${error.message}`,
      error.stack,
      'PaymentNotificationWorker',
    );
  }

  @OnWorkerEvent('error')
  onError(error: Error): void {
    this.logger.error(`Worker error: ${error.message}`, error.stack, 'PaymentNotificationWorker');
  }

  @OnWorkerEvent('stalled')
  onStalled(jobId: string): void {
    this.logger.warn(`Job ${jobId} stalled and will be requeued`, 'PaymentNotificationWorker');
  }
}
