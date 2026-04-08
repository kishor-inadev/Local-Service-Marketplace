import { Injectable, Inject, LoggerService } from "@nestjs/common";
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";
import { NotificationDeliveryRepository } from "../repositories/notification-delivery.repository";
import { NotificationRepository } from "../repositories/notification.repository";

@Injectable()
export class PushWorkerService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly deliveryRepository: NotificationDeliveryRepository,
    private readonly notificationRepository: NotificationRepository,
  ) {}

  async processPendingPushNotifications(): Promise<void> {
    this.logger.log(
      "Processing pending push notifications",
      "PushWorkerService",
    );

    try {
      const pendingDeliveries =
        await this.deliveryRepository.getPendingDeliveries();
      const pushDeliveries = pendingDeliveries.filter(
        (d) => d.channel === "push",
      );

      this.logger.log(
        `Found ${pushDeliveries.length} pending push deliveries`,
        "PushWorkerService",
      );

      for (const delivery of pushDeliveries) {
        try {
          // Get notification details
          const notification =
            await this.notificationRepository.getNotificationById(
              delivery.notification_id,
            );

          if (!notification) {
            this.logger.warn(
              `Notification ${delivery.notification_id} not found for delivery ${delivery.id}`,
              "PushWorkerService",
            );
            await this.deliveryRepository.updateDeliveryStatus(
              delivery.id,
              "failed",
            );
            continue;
          }

          // Simulate sending push notification (in production, integrate with FCM, APNs)
          await this.sendPushNotification(
            notification.user_id,
            notification.type,
            notification.message,
          );

          // Mark delivery as sent
          await this.deliveryRepository.updateDeliveryStatus(
            delivery.id,
            "sent",
          );
          this.logger.log(
            `Push notification sent successfully for delivery ${delivery.id}`,
            "PushWorkerService",
          );
        } catch (error) {
          this.logger.error(
            `Failed to send push notification for delivery ${delivery.id}: ${error.message}`,
            "PushWorkerService",
          );
          await this.deliveryRepository.updateDeliveryStatus(
            delivery.id,
            "failed",
          );
        }
      }

      this.logger.log(
        "Push notification processing completed",
        "PushWorkerService",
      );
    } catch (error) {
      this.logger.error(
        `Push notification processing failed: ${error.message}`,
        "PushWorkerService",
      );
    }
  }

  private async sendPushNotification(
    userId: string,
    type: string,
    message: string,
  ): Promise<void> {
    // Simulate push notification sending with delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    // In production, integrate with push notification service:
    // const fcm = new FCM(process.env.FCM_SERVER_KEY);
    // await fcm.send({
    //   to: deviceToken,
    //   notification: {
    //     title: type,
    //     body: message,
    //   },
    // });

    this.logger.log(
      `Push notification sent to user ${userId} with type ${type}`,
      "PushWorkerService",
    );
  }
}
