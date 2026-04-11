import { Processor, WorkerHost, InjectQueue, OnWorkerEvent } from '@nestjs/bullmq';
import { Inject, LoggerService, OnModuleInit, Optional } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Job, Queue } from 'bullmq';
import { NotificationDeliveryRepository } from '../notification/repositories/notification-delivery.repository';
import { NotificationRepository } from '../notification/repositories/notification.repository';
import { PushNotificationService } from '../notification/services/push-notification.service';
import { DeadLetterQueueService } from '../common/dlq/dead-letter-queue.service';

export interface DeliverPushJobData {
  deliveryId: string;
  notificationId: string;
  userId: string;
  type: string;
  message: string;
  deviceToken?: string;
}

/**
 * PushWorker — consumes the "comms.push" queue.
 *
 * Replaces the idle PushWorkerService that polled the DB
 * but was never scheduled.
 *
 * Handles:
 *   deliver-push       : deliver a single push notification
 *   retry-push-worker  : (repeatable) re-queue failed push deliveries
 */
@Processor('comms.push', {
  concurrency: parseInt(process.env.WORKER_CONCURRENCY || '5', 10),
})
export class PushWorker extends WorkerHost implements OnModuleInit {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    @InjectQueue('comms.push') private readonly pushQueue: Queue,
    private readonly deliveryRepository: NotificationDeliveryRepository,
    private readonly notificationRepository: NotificationRepository,
    private readonly pushNotificationService: PushNotificationService,
    @Optional() private readonly dlqService?: DeadLetterQueueService,
  ) {
    super();
  }

  async onModuleInit(): Promise<void> {
    await this.pushQueue.add(
      'retry-push-worker',
      {},
      {
        repeat: { pattern: '*/15 * * * *' },
        removeOnComplete: true,
        removeOnFail: { count: 10 },
        jobId: 'comms.push.retry-recurring',
      },
    );
    this.logger.log('PushWorker: repeatable retry job registered', 'PushWorker');
  }

  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case 'deliver-push':
        return this.handleDeliverPush(job as Job<DeliverPushJobData>);
      case 'retry-push-worker':
        return this.handleRetryPushWorker();
      default:
        this.logger.warn(`PushWorker: unknown job name "${job.name}"`, 'PushWorker');
    }
  }

  // ─────────────────────────────────────────────────────────────────

  private async handleDeliverPush(job: Job<DeliverPushJobData>): Promise<void> {
    const { deliveryId, userId, type, message, deviceToken } = job.data;

    this.logger.log(
      `PushWorker: delivering push for delivery ${deliveryId} (attempt ${job.attemptsMade + 1})`,
      'PushWorker',
    );

    try {
      // Send push notification via Firebase Cloud Messaging
      const success = await this.pushNotificationService.sendPushNotification({
        userId,
        title: type,
        body: message,
        deviceToken,
        data: {
          notificationId: job.data.notificationId,
          type,
        },
      });

      if (success) {
        await this.deliveryRepository.updateDeliveryStatus(deliveryId, 'sent');
        this.logger.log(`PushWorker: delivery ${deliveryId} sent`, 'PushWorker');
      } else {
        // Failed but not due to exception (e.g., no device token)
        await this.deliveryRepository.updateDeliveryStatus(deliveryId, 'failed');
        this.logger.warn(
          `PushWorker: delivery ${deliveryId} failed (no device token or FCM error)`,
          'PushWorker',
        );
      }
    } catch (error) {
      this.logger.error(
        `PushWorker: delivery ${deliveryId} failed — ${error.message}`,
        error.stack,
        'PushWorker',
      );
      await this.deliveryRepository.updateDeliveryStatus(deliveryId, 'failed');
      
      // Capture in DLQ if max retries reached
      if (this.dlqService && job.attemptsMade >= 3) {
        await this.dlqService.captureFailedJob('comms.push', job, error);
      }
      
      throw error;
    }
  }

  private async handleRetryPushWorker(): Promise<void> {
    this.logger.log('PushWorker: scanning for pending push deliveries...', 'PushWorker');

    const pending = await this.deliveryRepository.getPendingDeliveries();
    const pushDeliveries = pending.filter((d) => d.channel === 'push');

    if (pushDeliveries.length === 0) return;

    this.logger.log(
      `PushWorker: re-queuing ${pushDeliveries.length} pending push deliveries`,
      'PushWorker',
    );

    for (const delivery of pushDeliveries) {
      const notification = await this.notificationRepository.getNotificationById(
        delivery.notification_id,
      );
      if (!notification) {
        await this.deliveryRepository.updateDeliveryStatus(delivery.id, 'failed');
        continue;
      }

      await this.pushQueue.add('deliver-push', {
        deliveryId: delivery.id,
        notificationId: notification.id,
        userId: notification.user_id,
        type: notification.type,
        message: notification.message,
      });
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // Worker lifecycle hooks
  // ─────────────────────────────────────────────────────────────────

  @OnWorkerEvent('active')
  onActive(job: Job): void {
    this.logger.log(`Job "${job.name}/${job.id}" started (attempt ${job.attemptsMade + 1})`, 'PushWorker');
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job): void {
    this.logger.log(`Job "${job.name}/${job.id}" completed`, 'PushWorker');
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job | undefined, error: Error): void {
    this.logger.error(
      `Job "${job?.name ?? 'unknown'}/${job?.id ?? '?'}" failed (attempt ${job?.attemptsMade ?? 0}): ${error.message}`,
      error.stack,
      'PushWorker',
    );
  }

  @OnWorkerEvent('error')
  onError(error: Error): void {
    this.logger.error(`Worker error: ${error.message}`, error.stack, 'PushWorker');
  }

  @OnWorkerEvent('stalled')
  onStalled(jobId: string): void {
    this.logger.warn(`Job ${jobId} stalled and will be requeued`, 'PushWorker');
  }
}
