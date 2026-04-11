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
  ) { }

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

          // Push notifications require a device token and FCM/APNs integration.
          // The PushNotificationService (BullMQ comms.push queue) is the correct
          // path for production push delivery. This HTTP-admin endpoint cannot
          // resolve device tokens from a user_id alone, so we surface an error
          // instead of silently faking success.
          throw new Error(
            `Push delivery ${delivery.id}: device token resolution requires PushNotificationService — use the BullMQ worker path instead`,
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
        } catch (error: any) {
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
    } catch (error: any) {
      this.logger.error(
        `Push notification processing failed: ${error.message}`,
        "PushWorkerService",
      );
    }
  }
}

