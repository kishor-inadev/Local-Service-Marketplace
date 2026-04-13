import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Inject, LoggerService, OnModuleInit } from '@nestjs/common';
import { Job } from 'bullmq';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { NotificationClient } from '../common/notification/notification.client';
import { UserClient } from '../common/user/user.client';

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
    try {
      switch (job.name) {
        case 'notify-request-created': return this.handleRequestCreated(job.data);
        case 'notify-request-updated': return this.handleRequestUpdated(job.data);
        case 'notify-request-deleted': return this.handleRequestDeleted(job.data);
        case 'notify-request-cancelled': return this.handleRequestCancelled(job.data);
        case 'notify-proposal-submitted': return this.handleProposalSubmitted(job.data);
        case 'notify-proposal-accepted': return this.handleProposalAccepted(job.data);
        case 'notify-proposal-rejected': return this.handleProposalRejected(job.data);
        case 'notify-job-assigned': return this.handleJobAssigned(job.data);
        case 'notify-job-status-changed': return this.handleJobStatusChanged(job.data);
        case 'notify-job-completed': return this.handleJobCompleted(job.data);
        case 'notify-job-cancelled': return this.handleJobCancelled(job.data);
        case 'notify-review-created': return this.handleReviewCreated(job.data);
        default:
          throw new Error(`Unknown job name: ${job.name}`);
      }
    } catch (error: any) {
      const err = error as Error;
      this.logger.error(`Job "${job.name}/${job.id}" threw: ${err.message}`, err.stack, 'MarketplaceNotificationWorker');
      throw error;
    }
  }

  private async handleRequestCreated(data: any): Promise<void> {
    const { userId, guestEmail, requestId, description, budget, category } = data;
    const emailTo = userId ? await this.userClient.getUserEmail(userId) : guestEmail;
    if (!emailTo) return;
    const username = userId ? await this.userClient.getUserName(userId).catch(() => null) : null;
    await this.notificationClient.sendEmail({
      to: emailTo,
      template: 'MARKETPLACE_NEW_REQUEST',
      variables: {
        providerName: username || 'Service Provider',
        requestTitle: description?.substring(0, 80) || 'Service Request',
        category: category || 'General',
        budget: budget ? `₹${budget}` : 'Not specified',
        customerName: username || emailTo.split('@')[0],
        requestDisplayId: requestId,
        requestUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/requests/${requestId}`,
      },
    });
  }

  private async handleRequestUpdated(data: any): Promise<void> {
    const { userId, requestId, changes } = data;
    const emailTo = await this.userClient.getUserEmail(userId);
    if (!emailTo) return;
    const username = await this.userClient.getUserName(userId).catch(() => null);
    await this.notificationClient.sendEmail({
      to: emailTo,
      template: 'MESSAGE_RECEIVED',
      variables: {
        recipientName: username || emailTo.split('@')[0],
        senderName: 'LocalServices',
        messagePreview: `Your service request #${requestId} has been updated. Changes: ${JSON.stringify(changes)}`,
        replyUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/requests/${requestId}`,
      },
    });
  }

  private async handleRequestDeleted(data: any): Promise<void> {
    const { userId, requestId } = data;
    const emailTo = await this.userClient.getUserEmail(userId);
    if (!emailTo) return;
    const username = await this.userClient.getUserName(userId).catch(() => null);
    await this.notificationClient.sendEmail({
      to: emailTo,
      template: 'ORDER_CANCELLED',
      variables: {
        username: username || emailTo.split('@')[0],
        orderId: requestId,
        cancelledBy: 'user',
        reason: 'Request deleted',
      },
    });
  }

  private async handleRequestCancelled(data: any): Promise<void> {
    const { userId, requestId, reason } = data;
    const emailTo = await this.userClient.getUserEmail(userId);
    if (!emailTo) return;
    const username = await this.userClient.getUserName(userId).catch(() => null);
    await this.notificationClient.sendEmail({
      to: emailTo,
      template: 'ORDER_CANCELLED',
      variables: {
        username: username || emailTo.split('@')[0],
        orderId: requestId,
        cancelledBy: 'user',
        reason: reason || 'Request cancelled',
      },
    });
  }

  private async handleProposalSubmitted(data: any): Promise<void> {
    const { customerId, providerId, requestId, proposalId, price, estimatedDuration } = data;
    const emailTo = await this.userClient.getUserEmail(customerId);
    if (!emailTo) return;
    const [customerName, providerName] = await Promise.all([
      this.userClient.getUserName(customerId).catch(() => null),
      this.userClient.getUserName(providerId).catch(() => null),
    ]);
    await this.notificationClient.sendEmail({
      to: emailTo,
      template: 'MARKETPLACE_PROPOSAL_RECEIVED',
      variables: {
        customerName: customerName || emailTo.split('@')[0],
        providerName: providerName || 'Service Provider',
        requestTitle: `Request #${requestId}`,
        price: price ? `₹${price}` : 'To be confirmed',
        estimatedDuration: estimatedDuration || 'To be confirmed',
        proposalDisplayId: proposalId,
        requestDisplayId: requestId,
        proposalUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/requests/${requestId}/proposals/${proposalId}`,
      },
    });
  }

  private async handleProposalAccepted(data: any): Promise<void> {
    const { providerId, customerId, requestId, proposalId, price, jobId } = data;
    const emailTo = await this.userClient.getUserEmail(providerId);
    if (!emailTo) return;
    const [providerName, customerName] = await Promise.all([
      this.userClient.getUserName(providerId).catch(() => null),
      customerId ? this.userClient.getUserName(customerId).catch(() => null) : Promise.resolve(null),
    ]);
    await this.notificationClient.sendEmail({
      to: emailTo,
      template: 'MARKETPLACE_JOB_ASSIGNED',
      variables: {
        providerName: providerName || emailTo.split('@')[0],
        requestTitle: `Request #${requestId}`,
        customerName: customerName || 'Customer',
        price: price ? `₹${price}` : 'Agreed price',
        startDate: new Date().toLocaleDateString('en-IN'),
        jobDisplayId: jobId || proposalId,
        jobUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/jobs/${jobId || proposalId}`,
      },
    });
  }

  private async handleProposalRejected(data: any): Promise<void> {
    const { providerId, requestId, proposalId } = data;
    const emailTo = await this.userClient.getUserEmail(providerId);
    if (!emailTo) return;
    const providerName = await this.userClient.getUserName(providerId).catch(() => null);
    await this.notificationClient.sendEmail({
      to: emailTo,
      template: 'MESSAGE_RECEIVED',
      variables: {
        recipientName: providerName || emailTo.split('@')[0],
        senderName: 'LocalServices',
        messagePreview: `Your proposal #${proposalId} for request #${requestId} was not selected. Keep applying for new opportunities!`,
        replyUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/requests/${requestId}`,
      },
    });
  }

  private async handleJobAssigned(data: any): Promise<void> {
    const { providerId, customerId, jobId, requestId, price } = data;
    const emailTo = await this.userClient.getUserEmail(providerId);
    if (!emailTo) return;
    const [providerName, customerName] = await Promise.all([
      this.userClient.getUserName(providerId).catch(() => null),
      customerId ? this.userClient.getUserName(customerId).catch(() => null) : Promise.resolve(null),
    ]);
    await this.notificationClient.sendEmail({
      to: emailTo,
      template: 'MARKETPLACE_JOB_ASSIGNED',
      variables: {
        providerName: providerName || emailTo.split('@')[0],
        requestTitle: `Request #${requestId}`,
        customerName: customerName || 'Customer',
        price: price ? `₹${price}` : 'Agreed price',
        startDate: new Date().toLocaleDateString('en-IN'),
        jobDisplayId: jobId,
        jobUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/jobs/${jobId}`,
      },
    });
  }

  private async handleJobStatusChanged(data: any): Promise<void> {
    const { userId, jobId, newStatus } = data;
    const emailTo = await this.userClient.getUserEmail(userId);
    if (!emailTo) return;
    const username = await this.userClient.getUserName(userId).catch(() => null);
    await this.notificationClient.sendEmail({
      to: emailTo,
      template: 'MESSAGE_RECEIVED',
      variables: {
        recipientName: username || emailTo.split('@')[0],
        senderName: 'LocalServices',
        messagePreview: `Your job #${jobId} status has been updated to: ${newStatus}`,
        replyUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/jobs/${jobId}`,
      },
    });
  }

  private async handleJobCompleted(data: any): Promise<void> {
    const { customerId, providerId, jobId, amount, jobTitle } = data;
    const [customerEmail, providerEmail] = await Promise.all([
      this.userClient.getUserEmail(customerId),
      this.userClient.getUserEmail(providerId),
    ]);
    const [customerName, providerName] = await Promise.all([
      customerEmail ? this.userClient.getUserName(customerId).catch(() => null) : Promise.resolve(null),
      providerEmail ? this.userClient.getUserName(providerId).catch(() => null) : Promise.resolve(null),
    ]);
    if (customerEmail) {
      await this.notificationClient.sendEmail({
        to: customerEmail,
        template: 'ORDER_DELIVERED',
        variables: {
          username: customerName || customerEmail.split('@')[0],
          orderId: jobId,
          deliveryDate: new Date().toLocaleDateString('en-IN'),
          deliveryAddress: 'At your service location',
        },
      });
    }
    if (providerEmail) {
      await this.notificationClient.sendEmail({
        to: providerEmail,
        template: 'MARKETPLACE_PAYMENT_RECEIVED',
        variables: {
          providerName: providerName || providerEmail.split('@')[0],
          amount: amount ? `₹${amount}` : 'Agreed amount',
          jobTitle: jobTitle || `Job #${jobId}`,
          customerName: customerName || 'Customer',
          paymentDisplayId: jobId,
          dashboardUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/provider/dashboard`,
        },
      });
    }
  }

  private async handleJobCancelled(data: any): Promise<void> {
    const { customerId, providerId, jobId, cancelledBy, reason } = data;
    const [customerEmail, providerEmail] = await Promise.all([
      this.userClient.getUserEmail(customerId),
      this.userClient.getUserEmail(providerId),
    ]);
    const [customerName, providerName] = await Promise.all([
      customerEmail ? this.userClient.getUserName(customerId).catch(() => null) : Promise.resolve(null),
      providerEmail ? this.userClient.getUserName(providerId).catch(() => null) : Promise.resolve(null),
    ]);
    if (customerEmail) {
      await this.notificationClient.sendEmail({
        to: customerEmail,
        template: 'ORDER_CANCELLED',
        variables: {
          username: customerName || customerEmail.split('@')[0],
          orderId: jobId,
          cancelledBy: cancelledBy || 'user',
          reason: reason || 'Job cancelled',
        },
      });
    }
    if (providerEmail) {
      await this.notificationClient.sendEmail({
        to: providerEmail,
        template: 'ORDER_CANCELLED',
        variables: {
          username: providerName || providerEmail.split('@')[0],
          orderId: jobId,
          cancelledBy: cancelledBy || 'user',
          reason: reason || 'Job cancelled',
        },
      });
    }
  }

  private async handleReviewCreated(data: any): Promise<void> {
    const { providerId, reviewId, rating, jobId, jobTitle } = data;
    const emailTo = await this.userClient.getUserEmail(providerId);
    if (!emailTo) return;
    const providerName = await this.userClient.getUserName(providerId).catch(() => null);
    await this.notificationClient.sendEmail({
      to: emailTo,
      template: 'REVIEW_REMINDER',
      variables: {
        username: providerName || emailTo.split('@')[0],
        productName: jobTitle || `Job #${jobId || reviewId}`,
        orderId: jobId || reviewId,
        purchaseDate: new Date().toLocaleDateString('en-IN'),
      },
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // Worker lifecycle hooks
  // ─────────────────────────────────────────────────────────────────

  @OnWorkerEvent('active')
  onActive(job: Job): void {
    this.logger.log(`Job "${job.name}/${job.id}" started (attempt ${job.attemptsMade + 1})`, 'MarketplaceNotificationWorker');
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job): void {
    this.logger.log(`Job "${job.name}/${job.id}" completed`, 'MarketplaceNotificationWorker');
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job | undefined, error: Error): void {
    this.logger.error(
      `Job "${job?.name ?? 'unknown'}/${job?.id ?? '?'}" failed (attempt ${job?.attemptsMade ?? 0}): ${error.message}`,
      error.stack,
      'MarketplaceNotificationWorker',
    );
  }

  @OnWorkerEvent('error')
  onError(error: Error): void {
    this.logger.error(`Worker error: ${error.message}`, error.stack, 'MarketplaceNotificationWorker');
  }

  @OnWorkerEvent('stalled')
  onStalled(jobId: string): void {
    this.logger.warn(`Job ${jobId} stalled and will be requeued`, 'MarketplaceNotificationWorker');
  }
}
