import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Inject, LoggerService, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { SavedPaymentMethodRepository } from '../payment/repositories/saved-payment-method.repository';
import { NotificationClient } from '../common/notification/notification.client';
import { DEFAULT_JOB_OPTIONS } from '../bullmq/bullmq-default-options';

@Processor('payment.method-expiry', {
  concurrency: parseInt(process.env.WORKER_CONCURRENCY || '3', 10),
})
export class MethodExpiryWorker extends WorkerHost implements OnModuleInit {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    @InjectQueue('payment.method-expiry') private readonly methodExpiryQueue: Queue,
    private readonly paymentMethodRepository: SavedPaymentMethodRepository,
    private readonly notificationClient: NotificationClient,
  ) {
    super();
  }

  async onModuleInit(): Promise<void> {
    // Replace @Cron(EVERY_DAY_AT_11AM)
    await this.methodExpiryQueue.add(
      'check-expiring-payment-methods',
      {},
      { ...DEFAULT_JOB_OPTIONS, repeat: { pattern: '0 11 * * *' } },
    );
    this.logger.log('Payment method expiry repeatable job registered', 'MethodExpiryWorker');
  }

  async process(job: Job<any, any, string>): Promise<any> {
    try {
      switch (job.name) {
        case 'check-expiring-payment-methods':
          return this.handleCheckExpiringMethods();
        default:
          throw new Error(`Unknown job name: ${job.name}`);
      }
    } catch (error: any) {
      const err = error as Error;
      this.logger.error(`Job "${job.name}/${job.id}" threw: ${err.message}`, err.stack, 'MethodExpiryWorker');
      throw error;
    }
  }

  private async handleCheckExpiringMethods(): Promise<void> {
    this.logger.log('Checking for expiring payment methods', 'MethodExpiryWorker');

    const expiringMethods = await this.paymentMethodRepository.findExpiringWithinMonths(1);

    if (expiringMethods.length === 0) {
      this.logger.log('No expiring payment methods found', 'MethodExpiryWorker');
      return;
    }

    // Group by user
    const methodsByUser = new Map<string, typeof expiringMethods>();
    for (const method of expiringMethods) {
      const current = methodsByUser.get(method.user_id) ?? [];
      current.push(method);
      methodsByUser.set(method.user_id, current);
    }

    let notifiedUsers = 0;
    for (const [userId, methods] of methodsByUser.entries()) {
      const destinationEmail = methods.find((m) => !!m.billing_email)?.billing_email;
      if (!destinationEmail) {
        this.logger.warn(`Skipping expiry notification for user ${userId}: no billing email`, 'MethodExpiryWorker');
        continue;
      }

      const maskedMethods = methods.map(
        (m) => `${m.card_brand || 'card'} ****${m.last_four || '----'}`,
      );
      const earliest = methods[0];

      await this.notificationClient.sendEmail({
        to: destinationEmail,
        template: 'BILLING_INFO_UPDATED',
        variables: {
          username: destinationEmail.split('@')[0],
          updatedFields: maskedMethods.map((m) => `${m} expires ${earliest.expiry_month}/${earliest.expiry_year} — please update`),
          updatedAt: new Date().toISOString(),
        },
      });
      notifiedUsers++;
    }

    this.logger.log(`Payment method expiry: notified ${notifiedUsers} users`, 'MethodExpiryWorker');
  }

  // ─────────────────────────────────────────────────────────────────
  // Worker lifecycle hooks
  // ─────────────────────────────────────────────────────────────────

  @OnWorkerEvent('active')
  onActive(job: Job): void {
    this.logger.log(`Job "${job.name}/${job.id}" started (attempt ${job.attemptsMade + 1})`, 'MethodExpiryWorker');
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job): void {
    this.logger.log(`Job "${job.name}/${job.id}" completed`, 'MethodExpiryWorker');
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job | undefined, error: Error): void {
    this.logger.error(
      `Job "${job?.name ?? 'unknown'}/${job?.id ?? '?'}" failed (attempt ${job?.attemptsMade ?? 0}): ${error.message}`,
      error.stack,
      'MethodExpiryWorker',
    );
  }

  @OnWorkerEvent('error')
  onError(error: Error): void {
    this.logger.error(`Worker error: ${error.message}`, error.stack, 'MethodExpiryWorker');
  }

  @OnWorkerEvent('stalled')
  onStalled(jobId: string): void {
    this.logger.warn(`Job ${jobId} stalled and will be requeued`, 'MethodExpiryWorker');
  }
}
