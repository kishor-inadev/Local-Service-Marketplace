import { Processor, WorkerHost, InjectQueue } from '@nestjs/bullmq';
import { Inject, LoggerService, OnModuleInit } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Job, Queue } from 'bullmq';
import { NotificationRepository } from '../notification/repositories/notification.repository';
import { NotificationDeliveryRepository } from '../notification/repositories/notification-delivery.repository';

/**
 * CleanupWorker — consumes the "comms.cleanup" queue.
 *
 * Handles:
 *   purge-old-notifications  : (repeatable weekly) delete notifications + deliveries > 90 days old
 *   purge-failed-deliveries  : (repeatable weekly) delete failed delivery records > 30 days old
 */
@Processor('comms.cleanup', {
  concurrency: 1,
})
export class CleanupWorker extends WorkerHost implements OnModuleInit {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    @InjectQueue('comms.cleanup') private readonly cleanupQueue: Queue,
    private readonly notificationRepository: NotificationRepository,
    private readonly deliveryRepository: NotificationDeliveryRepository,
  ) {
    super();
  }

  async onModuleInit(): Promise<void> {
    // Weekly Sunday 3 AM — purge old notifications
    await this.cleanupQueue.add(
      'purge-old-notifications',
      {},
      {
        repeat: { pattern: '0 3 * * 0' },
        removeOnComplete: true,
        removeOnFail: { count: 5 },
        jobId: 'comms.cleanup.purge-notifications-recurring',
      },
    );

    // Weekly Sunday 4 AM — purge stale failed delivery records
    await this.cleanupQueue.add(
      'purge-failed-deliveries',
      {},
      {
        repeat: { pattern: '0 4 * * 0' },
        removeOnComplete: true,
        removeOnFail: { count: 5 },
        jobId: 'comms.cleanup.purge-deliveries-recurring',
      },
    );

    this.logger.log('CleanupWorker: cleanup jobs registered', 'CleanupWorker');
  }

  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case 'purge-old-notifications':
        return this.handlePurgeOldNotifications();
      case 'purge-failed-deliveries':
        return this.handlePurgeFailedDeliveries();
      default:
        this.logger.warn(`CleanupWorker: unknown job name "${job.name}"`, 'CleanupWorker');
    }
  }

  // ─────────────────────────────────────────────────────────────────

  private async handlePurgeOldNotifications(): Promise<void> {
    this.logger.log('CleanupWorker: purging notifications older than 90 days...', 'CleanupWorker');

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);

    const deletedCount = await this.notificationRepository.deleteOlderThan(cutoff);

    this.logger.log(
      `CleanupWorker: purged ${deletedCount} old notifications`,
      'CleanupWorker',
    );
  }

  private async handlePurgeFailedDeliveries(): Promise<void> {
    this.logger.log('CleanupWorker: purging failed deliveries older than 30 days...', 'CleanupWorker');

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);

    const deletedCount = await this.deliveryRepository.deleteFailedOlderThan(cutoff);

    this.logger.log(
      `CleanupWorker: purged ${deletedCount} failed delivery records`,
      'CleanupWorker',
    );
  }
}
