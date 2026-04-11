import { Processor, WorkerHost, InjectQueue } from '@nestjs/bullmq';
import { Inject, LoggerService, OnModuleInit, Optional } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Job, Queue } from 'bullmq';
import { NotificationDeliveryRepository } from '../notification/repositories/notification-delivery.repository';
import { NotificationRepository } from '../notification/repositories/notification.repository';
import { EmailClient } from '../notification/clients/email.client';
import { DeadLetterQueueService } from '../common/dlq/dead-letter-queue.service';

export interface DeliverEmailJobData {
  deliveryId: string;
  notificationId: string;
  userId: string;
  type: string;
  message: string;
  to?: string;
  template?: string;
  variables?: Record<string, any>;
}

/**
 * EmailWorker — consumes the "comms.email" queue.
 *
 * Handles:
 *   deliver-email        : deliver a single notification email
 *   retry-email-worker   : (repeatable) re-queue any pending/failed deliveries older than 5 min
 */
@Processor('comms.email', {
  concurrency: parseInt(process.env.WORKER_CONCURRENCY || '5', 10),
})
export class EmailWorker extends WorkerHost implements OnModuleInit {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    @InjectQueue('comms.email') private readonly emailQueue: Queue,
    private readonly deliveryRepository: NotificationDeliveryRepository,
    private readonly notificationRepository: NotificationRepository,
    private readonly emailClient: EmailClient,
    @Optional() private readonly dlqService?: DeadLetterQueueService,
  ) {
    super();
  }

  async onModuleInit(): Promise<void> {
    // Register repeatable retry job — runs every 15 minutes
    await this.emailQueue.add(
      'retry-email-worker',
      {},
      {
        repeat: { pattern: '*/15 * * * *' },
        removeOnComplete: true,
        removeOnFail: { count: 10 },
        jobId: 'comms.email.retry-recurring',
      },
    );
    this.logger.log('EmailWorker: repeatable retry job registered', 'EmailWorker');
  }

  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case 'deliver-email':
        return this.handleDeliverEmail(job as Job<DeliverEmailJobData>);
      case 'retry-email-worker':
        return this.handleRetryEmailWorker();
      default:
        this.logger.warn(`EmailWorker: unknown job name "${job.name}"`, 'EmailWorker');
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────────────────────────────

  private async handleDeliverEmail(job: Job<DeliverEmailJobData>): Promise<void> {
    const { deliveryId, notificationId, userId, type, message, to, template, variables } = job.data;

    this.logger.log(
      `EmailWorker: delivering email for delivery ${deliveryId} (attempt ${job.attemptsMade + 1})`,
      'EmailWorker',
    );

    try {
      const subject = (variables?.subject as string) || type || 'Notification';

      if (to) {
        // Direct email with explicit recipient
        await this.emailClient.sendEmail({
          to,
          subject,
          template: template || 'notification',
          text: message,
          variables: variables || { type, message },
        });
      } else {
        // Notification-linked email — recipient resolved by emailClient from userId
        await this.emailClient.sendEmail({
          to: userId,
          subject,
          template: template || 'notification',
          variables: { type, message },
        });
      }

      await this.deliveryRepository.updateDeliveryStatus(deliveryId, 'sent');

      this.logger.log(
        `EmailWorker: delivery ${deliveryId} sent successfully`,
        'EmailWorker',
      );
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `EmailWorker: delivery ${deliveryId} failed — ${err.message}`,
        err.stack,
        'EmailWorker',
      );
      await this.deliveryRepository.updateDeliveryStatus(deliveryId, 'failed');
      
      // Capture in DLQ if max attempts reached
      if (this.dlqService && job.attemptsMade >= 3) {
        await this.dlqService.captureFailedJob('comms.email', job, err);
      }
      
      // Re-throw so BullMQ retries with exponential back-off
      throw error;
    }
  }

  /**
   * Repeatable job: pick up stuck pending/failed deliveries and re-enqueue them.
   * Acts as a safety net for deliveries that were never processed (e.g. worker was down).
   */
  private async handleRetryEmailWorker(): Promise<void> {
    this.logger.log('EmailWorker: scanning for pending email deliveries...', 'EmailWorker');

    const pendingDeliveries = await this.deliveryRepository.getPendingDeliveries();
    const emailDeliveries = pendingDeliveries.filter((d) => d.channel === 'email');

    if (emailDeliveries.length === 0) {
      this.logger.log('EmailWorker: no pending email deliveries found', 'EmailWorker');
      return;
    }

    this.logger.log(
      `EmailWorker: re-queuing ${emailDeliveries.length} pending email deliveries`,
      'EmailWorker',
    );

    for (const delivery of emailDeliveries) {
      const notification = await this.notificationRepository.getNotificationById(
        delivery.notification_id,
      );
      if (!notification) {
        await this.deliveryRepository.updateDeliveryStatus(delivery.id, 'failed');
        continue;
      }

      await this.emailQueue.add('deliver-email', {
        deliveryId: delivery.id,
        notificationId: notification.id,
        userId: notification.user_id,
        type: notification.type,
        message: notification.message,
      });
    }
  }
}
