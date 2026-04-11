import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Inject, OnModuleInit } from '@nestjs/common';
import { Job } from 'bullmq';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { NotificationClient } from '../common/notification/notification.client';

@Processor('identity.notification', {
  concurrency: parseInt(process.env.WORKER_CONCURRENCY || '5', 10),
})
export class IdentityNotificationWorker extends WorkerHost implements OnModuleInit {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly notificationClient: NotificationClient,
  ) {
    super();
  }

  async onModuleInit(): Promise<void> {
    // No repeatable jobs — notifications are event-driven
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { to, template, variables } = job.data;
    try {
      await this.notificationClient.sendEmail({ to, template, variables });
      this.logger.info('Identity notification sent', {
        context: 'IdentityNotificationWorker',
        template,
        to,
      });
    } catch (error) {
      this.logger.error('Identity notification failed', {
        context: 'IdentityNotificationWorker',
        template,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // Worker lifecycle hooks
  // ─────────────────────────────────────────────────────────────────

  @OnWorkerEvent('active')
  onActive(job: Job): void {
    this.logger.info(`Job "${job.name}/${job.id}" started (attempt ${job.attemptsMade + 1})`, { context: 'IdentityNotificationWorker' });
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job): void {
    this.logger.info(`Job "${job.name}/${job.id}" completed`, { context: 'IdentityNotificationWorker' });
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job | undefined, error: Error): void {
    this.logger.error(
      `Job "${job?.name ?? 'unknown'}/${job?.id ?? '?'}" failed (attempt ${job?.attemptsMade ?? 0}): ${error.message}`,
      { context: 'IdentityNotificationWorker', stack: error.stack },
    );
  }

  @OnWorkerEvent('error')
  onError(error: Error): void {
    this.logger.error(`Worker error: ${error.message}`, { context: 'IdentityNotificationWorker', stack: error.stack });
  }

  @OnWorkerEvent('stalled')
  onStalled(jobId: string): void {
    this.logger.warn(`Job ${jobId} stalled and will be requeued`, { context: 'IdentityNotificationWorker' });
  }
}
