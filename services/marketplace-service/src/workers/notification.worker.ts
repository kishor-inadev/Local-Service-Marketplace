import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, LoggerService, OnModuleInit } from '@nestjs/common';
import { Job } from 'bullmq';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { NotificationClient } from '../../common/notification/notification.client';
import { UserClient } from '../../common/user/user.client';

@Processor('marketplace.notification', {
  concurrency: parseInt(process.env.WORKER_CONCURRENCY || '5', 10),
})
export class MarketplaceNotificationWorker extends WorkerHost implements OnModuleInit {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly notificationClient: NotificationClient,
    private readonly userClient: UserClient,
  ) {
    super();
  }

  async onModuleInit(): Promise<void> {
    // No repeatable jobs — notifications are event-driven
  }

  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case 'notify-request-created':          return this.handleRequestCreated(job.data);
      case 'notify-request-updated':          return this.handleRequestUpdated(job.data);
      case 'notify-request-deleted':          return this.handleRequestDeleted(job.data);
      case 'notify-proposal-submitted':       return this.handleProposalSubmitted(job.data);
      case 'notify-proposal-accepted':        return this.handleProposalAccepted(job.data);
      case 'notify-proposal-rejected':        return this.handleProposalRejected(job.data);
      case 'notify-job-assigned':             return this.handleJobAssigned(job.data);
      case 'notify-job-status-changed':       return this.handleJobStatusChanged(job.data);
      case 'notify-job-completed':            return this.handleJobCompleted(job.data);
      case 'notify-review-created':           return this.handleReviewCreated(job.data);
      default:
        throw new Error(`Unknown job name: ${job.name}`);
    }
  }

  private async handleRequestCreated(data: any): Promise<void> {
    const { userId, guestEmail, requestId, description, budget } = data;
    const emailTo = userId ? await this.userClient.getUserEmail(userId) : guestEmail;
    if (!emailTo) return;
    await this.notificationClient.sendEmail({
      to: emailTo,
      template: 'newRequest',
      variables: {
        serviceName: description?.substring(0, 50) || 'Service Request',
        requestId,
        budget,
        requestUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/requests/${requestId}`,
      },
    });
  }

  private async handleRequestUpdated(data: any): Promise<void> {
    const { userId, requestId, changes } = data;
    const emailTo = await this.userClient.getUserEmail(userId);
    if (!emailTo) return;
    await this.notificationClient.sendEmail({
      to: emailTo,
      template: 'requestUpdated',
      variables: { requestId, changes },
    });
  }

  private async handleRequestDeleted(data: any): Promise<void> {
    const { userId, requestId } = data;
    const emailTo = await this.userClient.getUserEmail(userId);
    if (!emailTo) return;
    await this.notificationClient.sendEmail({
      to: emailTo,
      template: 'requestCancelled',
      variables: { requestId },
    });
  }

  private async handleProposalSubmitted(data: any): Promise<void> {
    const { customerId, providerId, requestId, proposalId, price } = data;
    const emailTo = await this.userClient.getUserEmail(customerId);
    if (!emailTo) return;
    await this.notificationClient.sendEmail({
      to: emailTo,
      template: 'newProposal',
      variables: { providerId, requestId, proposalId, price },
    });
  }

  private async handleProposalAccepted(data: any): Promise<void> {
    const { providerId, requestId, proposalId } = data;
    const emailTo = await this.userClient.getUserEmail(providerId);
    if (!emailTo) return;
    await this.notificationClient.sendEmail({
      to: emailTo,
      template: 'proposalAccepted',
      variables: { requestId, proposalId },
    });
  }

  private async handleProposalRejected(data: any): Promise<void> {
    const { providerId, requestId, proposalId } = data;
    const emailTo = await this.userClient.getUserEmail(providerId);
    if (!emailTo) return;
    await this.notificationClient.sendEmail({
      to: emailTo,
      template: 'proposalRejected',
      variables: { requestId, proposalId },
    });
  }

  private async handleJobAssigned(data: any): Promise<void> {
    const { providerId, jobId, requestId } = data;
    const emailTo = await this.userClient.getUserEmail(providerId);
    if (!emailTo) return;
    await this.notificationClient.sendEmail({
      to: emailTo,
      template: 'jobAssigned',
      variables: { jobId, requestId },
    });
  }

  private async handleJobStatusChanged(data: any): Promise<void> {
    const { userId, jobId, newStatus } = data;
    const emailTo = await this.userClient.getUserEmail(userId);
    if (!emailTo) return;
    await this.notificationClient.sendEmail({
      to: emailTo,
      template: 'jobStatusChanged',
      variables: { jobId, newStatus },
    });
  }

  private async handleJobCompleted(data: any): Promise<void> {
    const { customerId, providerId, jobId } = data;
    const [customerEmail, providerEmail] = await Promise.all([
      this.userClient.getUserEmail(customerId),
      this.userClient.getUserEmail(providerId),
    ]);
    if (customerEmail) {
      await this.notificationClient.sendEmail({
        to: customerEmail,
        template: 'jobCompleted',
        variables: { jobId },
      });
    }
    if (providerEmail) {
      await this.notificationClient.sendEmail({
        to: providerEmail,
        template: 'jobCompletedProvider',
        variables: { jobId },
      });
    }
  }

  private async handleReviewCreated(data: any): Promise<void> {
    const { providerId, reviewId, rating } = data;
    const emailTo = await this.userClient.getUserEmail(providerId);
    if (!emailTo) return;
    await this.notificationClient.sendEmail({
      to: emailTo,
      template: 'reviewReceived',
      variables: { reviewId, rating },
    });
  }
}
