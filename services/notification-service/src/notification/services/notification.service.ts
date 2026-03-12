import { Injectable, Inject, LoggerService } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { NotificationRepository } from '../repositories/notification.repository';
import { NotificationDeliveryRepository } from '../repositories/notification-delivery.repository';
import { Notification } from '../entities/notification.entity';
import { NotFoundException } from '../../common/exceptions/http.exceptions';

@Injectable()
export class NotificationService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
    @InjectQueue('email-queue') private readonly emailQueue: Queue,
    private readonly notificationRepository: NotificationRepository,
    private readonly deliveryRepository: NotificationDeliveryRepository,
  ) {}

  async createNotification(userId: string, type: string, message: string): Promise<Notification> {
    this.logger.log(`Creating notification for user ${userId}`, 'NotificationService');
    const notification = await this.notificationRepository.createNotification(userId, type, message);

    // Create delivery records for email and push channels
    const emailDelivery = await this.deliveryRepository.createDelivery(notification.id, 'email', 'pending');
    const pushDelivery = await this.deliveryRepository.createDelivery(notification.id, 'push', 'pending');

    // Queue email sending job (background processing)
    await this.emailQueue.add(
      'send-email',
      {
        deliveryId: emailDelivery.id,
        notificationId: notification.id,
        userId,
        type,
        message,
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    );

    this.logger.log(
      `Notification created and queued successfully: ${notification.id}`,
      'NotificationService',
    );
    return notification;
  }

  async getNotificationById(id: string): Promise<Notification> {
    this.logger.log(`Fetching notification ${id}`, 'NotificationService');
    const notification = await this.notificationRepository.getNotificationById(id);
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }
    return notification;
  }

  async getNotificationsByUserId(userId: string, limit: number = 50): Promise<Notification[]> {
    this.logger.log(`Fetching notifications for user ${userId}`, 'NotificationService');
    return this.notificationRepository.getNotificationsByUserId(userId, limit);
  }

  async markAsRead(id: string): Promise<Notification> {
    this.logger.log(`Marking notification ${id} as read`, 'NotificationService');
    const notification = await this.getNotificationById(id);
    
    if (notification.read) {
      this.logger.log(`Notification ${id} already marked as read`, 'NotificationService');
      return notification;
    }

    const updatedNotification = await this.notificationRepository.markAsRead(id);
    this.logger.log(`Notification ${id} marked as read successfully`, 'NotificationService');
    return updatedNotification;
  }

  async getUnreadCount(userId: string): Promise<number> {
    this.logger.log(`Fetching unread count for user ${userId}`, 'NotificationService');
    return this.notificationRepository.getUnreadCount(userId);
  }
}
