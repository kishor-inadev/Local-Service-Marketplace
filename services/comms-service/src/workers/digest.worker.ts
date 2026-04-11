import { Processor, WorkerHost, InjectQueue, OnWorkerEvent } from '@nestjs/bullmq';
import { Inject, LoggerService, OnModuleInit } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Job, Queue } from 'bullmq';
import { NotificationRepository } from '../notification/repositories/notification.repository';
import { EmailClient } from '../notification/clients/email.client';
import { UserClient } from '../common/user/user.client';

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
    private readonly userClient: UserClient,
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
    try {
      switch (job.name) {
        case 'send-unread-digest':
          return this.handleSendUnreadDigest();
        default:
          this.logger.warn(`DigestWorker: unknown job name "${job.name}"`, 'DigestWorker');
      }
    } catch (error: any) {
      const err = error as Error;
      this.logger.error(`Job "${job.name}/${job.id}" threw: ${err.message}`, err.stack, 'DigestWorker');
      throw error;
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
        // Resolve the user's real email — group.userId is a UUID from the notifications table
        const userEmail = await this.userClient.getUserEmail(group.userId);
        if (!userEmail) {
          this.logger.warn(
            `DigestWorker: could not resolve email for user ${group.userId} — skipping`,
            'DigestWorker',
          );
          continue;
        }
        await this.emailClient.sendEmail({
          to: userEmail,
          subject: 'Your Daily Notification Digest',
          template: 'unread-digest',
          variables: {
            unreadCount: group.count,
            notifications: group.notifications?.slice(0, 5) ?? [],
          },
        });
        sent++;
      } catch (error: any) {
        const err = error as Error;
        this.logger.warn(
          `DigestWorker: digest email failed for user ${group.userId} — ${err.message}`,
          'DigestWorker',
        );
      }
    }

    this.logger.log(`DigestWorker: digest sent to ${sent}/${unreadGroups.length} users`, 'DigestWorker');
  }

  // ─────────────────────────────────────────────────────────────────
  // Worker lifecycle hooks
  // ─────────────────────────────────────────────────────────────────

  @OnWorkerEvent('active')
  onActive(job: Job): void {
    this.logger.log(`Job "${job.name}/${job.id}" started (attempt ${job.attemptsMade + 1})`, 'DigestWorker');
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job): void {
    this.logger.log(`Job "${job.name}/${job.id}" completed`, 'DigestWorker');
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job | undefined, error: Error): void {
    this.logger.error(
      `Job "${job?.name ?? 'unknown'}/${job?.id ?? '?'}" failed (attempt ${job?.attemptsMade ?? 0}): ${error.message}`,
      error.stack,
      'DigestWorker',
    );
  }

  @OnWorkerEvent('error')
  onError(error: Error): void {
    this.logger.error(`Worker error: ${error.message}`, error.stack, 'DigestWorker');
  }

  @OnWorkerEvent('stalled')
  onStalled(jobId: string): void {
    this.logger.warn(`Job ${jobId} stalled and will be requeued`, 'DigestWorker');
  }
}
