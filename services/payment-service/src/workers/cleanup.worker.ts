import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, LoggerService, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { WebhookRepository } from '../payment/repositories/webhook.repository';
import { CouponRepository } from '../payment/repositories/coupon.repository';
import { DEFAULT_JOB_OPTIONS } from '../bullmq/bullmq-default-options';

@Processor('payment.cleanup', {
  concurrency: 1,
})
export class PaymentCleanupWorker extends WorkerHost implements OnModuleInit {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    @InjectQueue('payment.cleanup') private readonly cleanupQueue: Queue,
    private readonly webhookRepository: WebhookRepository,
    private readonly couponRepository: CouponRepository,
  ) {
    super();
  }

  async onModuleInit(): Promise<void> {
    // Weekly Sunday 3 AM — purge processed webhooks older than 30 days
    await this.cleanupQueue.add(
      'purge-processed-webhooks',
      {},
      { ...DEFAULT_JOB_OPTIONS, repeat: { pattern: '0 3 * * 0' } },
    );

    // Weekly Sunday 4 AM — purge expired coupons
    await this.cleanupQueue.add(
      'purge-expired-coupons',
      {},
      { ...DEFAULT_JOB_OPTIONS, repeat: { pattern: '0 4 * * 0' } },
    );

    this.logger.log('Payment cleanup repeatable jobs registered', 'PaymentCleanupWorker');
  }

  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case 'purge-processed-webhooks':
        return this.handlePurgeProcessedWebhooks();
      case 'purge-expired-coupons':
        return this.handlePurgeExpiredCoupons();
      default:
        throw new Error(`Unknown job name: ${job.name}`);
    }
  }

  private async handlePurgeProcessedWebhooks(): Promise<void> {
    this.logger.log('Purging processed webhooks older than 30 days', 'PaymentCleanupWorker');
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const count = await this.webhookRepository.deleteProcessedBefore(cutoff);
    this.logger.log(`Purged ${count} processed webhooks`, 'PaymentCleanupWorker');
  }

  private async handlePurgeExpiredCoupons(): Promise<void> {
    this.logger.log('Purging expired coupons', 'PaymentCleanupWorker');
    const count = await this.couponRepository.deleteExpired();
    this.logger.log(`Purged ${count} expired coupons`, 'PaymentCleanupWorker');
  }
}
