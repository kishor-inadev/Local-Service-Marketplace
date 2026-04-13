import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Inject, LoggerService } from '@nestjs/common';
import { Job } from 'bullmq';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { NotificationClient } from '../common/notification/notification.client';
import { UserClient } from '../common/user/user.client';
import { DisputeRepository } from '../admin/repositories/dispute.repository';

@Processor('oversight.notification', {
  concurrency: parseInt(process.env.WORKER_CONCURRENCY || '3', 10),
})
export class DisputeNotificationWorker extends WorkerHost {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly notificationClient: NotificationClient,
    private readonly userClient: UserClient,
    private readonly disputeRepository: DisputeRepository,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    try {
      switch (job.name) {
        case 'notify-dispute-created':
          return this.handleDisputeCreated(job.data);
        case 'notify-dispute-status-changed':
          return this.handleDisputeStatusChanged(job.data);
        default:
          throw new Error(`Unknown job name: ${job.name}`);
      }
    } catch (error: any) {
      this.logger.error(
        `Job "${job.name}/${job.id}" threw: ${error.message}`,
        error.stack,
        'DisputeNotificationWorker',
      );
      throw error;
    }
  }

  private async handleDisputeCreated(data: any): Promise<void> {
    const { disputeId, openedBy, jobId } = data;
    const emailTo = await this.userClient.getUserEmail(openedBy);
    if (!emailTo) return;
    await this.notificationClient.sendEmail({
      to: emailTo,
      template: 'MESSAGE_RECEIVED',
      variables: {
        recipientName: emailTo.split('@')[0],
        senderName: 'LocalServices Support',
        messagePreview: `A dispute #${disputeId} has been opened for job #${jobId}. Our team will review it shortly.`,
        replyUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/disputes/${disputeId}`,
      },
    });
  }

  private async handleDisputeStatusChanged(data: any): Promise<void> {
    const { disputeId, openedBy, newStatus, resolution } = data;
    const emailTo = await this.userClient.getUserEmail(openedBy);
    if (!emailTo) return;
    await this.notificationClient.sendEmail({
      to: emailTo,
      template: 'MESSAGE_RECEIVED',
      variables: {
        recipientName: emailTo.split('@')[0],
        senderName: 'LocalServices Support',
        messagePreview: `Your dispute #${disputeId} status has been updated to: ${newStatus}. ${resolution ? 'Resolution: ' + resolution : ''}`,
        replyUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/disputes/${disputeId}`,
      },
    });
  }

  @OnWorkerEvent('active')
  onActive(job: Job): void {
    this.logger.log(
      `Job "${job.name}/${job.id}" started (attempt ${job.attemptsMade + 1})`,
      'DisputeNotificationWorker',
    );
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job): void {
    this.logger.log(`Job "${job.name}/${job.id}" completed`, 'DisputeNotificationWorker');
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job | undefined, error: Error): void {
    this.logger.error(
      `Job "${job?.name ?? 'unknown'}/${job?.id ?? '?'}" failed (attempt ${job?.attemptsMade ?? 0}): ${error.message}`,
      error.stack,
      'DisputeNotificationWorker',
    );
  }

  @OnWorkerEvent('error')
  onError(error: Error): void {
    this.logger.error(`Worker error: ${error.message}`, error.stack, 'DisputeNotificationWorker');
  }
}
