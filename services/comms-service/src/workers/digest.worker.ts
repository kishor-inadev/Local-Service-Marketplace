import { Processor, WorkerHost, InjectQueue } from '@nestjs/bullmq';
import { Inject, LoggerService, OnModuleInit } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Job, Queue } from 'bullmq';
import { NotificationRepository } from '../notification/repositories/notification.repository';
import { EmailClient } from '../notification/clients/email.client';

/**
 * DigestWorker — consumes the "comms.digest" queue.
 *
 * Handles:
 *   send-unread-digest : (repeatable daily 8 AM) collect users with unread
 *                        notifications and send a digest email
 */
@Processor('comms.digest', {
  concurrency: 2,
})
export class DigestWorker extends WorkerHost implements OnModuleInit {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    @InjectQueue('comms.digest') private readonly digestQueue: Queue,
    private readonly notificationRepository: NotificationRepository,
    private readonly emailClient: EmailClient,
  ) {
    super();
  }

  async onModuleInit(): Promise<void> {
    await this.digestQueue.add(
      'send-unread-digest',
      {},
      {
        repeat: { pattern: '0 8 * * *' },   // daily 08:00
        removeOnComplete: true,
        removeOnFail: { count: 10 },
        jobId: 'comms.digest.daily-recurring',
      },
    );
    this.logger.log('DigestWorker: daily digest job registered', 'DigestWorker');
  }

  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case 'send-unread-digest':
        return this.handleSendUnreadDigest();
      default:
        this.logger.warn(`DigestWorker: unknown job name "${job.name}"`, 'DigestWorker');
    }
  }

  // ─────────────────────────────────────────────────────────────────

  private async handleSendUnreadDigest(): Promise<void> {
    this.logger.log('DigestWorker: building daily unread digest...', 'DigestWorker');

    // Fetch users with unread notifications (limit to avoid memory spike)
    const unreadGroups = await this.notificationRepository.getUsersWithUnreadNotifications(100);

    if (!unreadGroups || unreadGroups.length === 0) {
      this.logger.log('DigestWorker: no unread notifications to digest', 'DigestWorker');
      return;
    }

    let sent = 0;
    for (const group of unreadGroups) {
      try {
        await this.emailClient.sendEmail({
          to: group.userId,
          subject: 'Your Daily Notification Digest',
          template: 'unread-digest',
          variables: {
            unreadCount: group.count,
            notifications: group.notifications?.slice(0, 5) ?? [],
          },
        });
        sent++;
      } catch (error) {
        const err = error as Error;
        this.logger.warn(
          `DigestWorker: digest email failed for user ${group.userId} — ${err.message}`,
          'DigestWorker',
        );
      }
    }

    this.logger.log(`DigestWorker: digest sent to ${sent}/${unreadGroups.length} users`, 'DigestWorker');
  }
}
