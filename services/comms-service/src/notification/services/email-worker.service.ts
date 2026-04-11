import { Injectable, Inject, LoggerService } from "@nestjs/common";
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";
import { NotificationDeliveryRepository } from "../repositories/notification-delivery.repository";
import { NotificationRepository } from "../repositories/notification.repository";
import { EmailClient } from "../clients/email.client";
import { UserClient } from "../../common/user/user.client";

@Injectable()
export class EmailWorkerService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly deliveryRepository: NotificationDeliveryRepository,
    private readonly notificationRepository: NotificationRepository,
    private readonly emailClient: EmailClient,
    private readonly userClient: UserClient,
  ) { }

  async processPendingEmails(): Promise<void> {
    this.logger.log(
      "Processing pending email notifications",
      "EmailWorkerService",
    );

    try {
      const pendingDeliveries =
        await this.deliveryRepository.getPendingDeliveries();
      const emailDeliveries = pendingDeliveries.filter(
        (d) => d.channel === "email",
      );

      this.logger.log(
        `Found ${emailDeliveries.length} pending email deliveries`,
        "EmailWorkerService",
      );

      for (const delivery of emailDeliveries) {
        try {
          // Get notification details
          const notification =
            await this.notificationRepository.getNotificationById(
              delivery.notification_id,
            );

          if (!notification) {
            this.logger.warn(
              `Notification ${delivery.notification_id} not found for delivery ${delivery.id}`,
              "EmailWorkerService",
            );
            await this.deliveryRepository.updateDeliveryStatus(
              delivery.id,
              "failed",
            );
            continue;
          }

          // Resolve user email from identity-service, fall back to null on error
          const userEmail = await this.userClient.getUserEmail(notification.user_id);
          if (!userEmail) {
            this.logger.warn(
              `EmailWorkerService: could not resolve email for user ${notification.user_id} — skipping delivery ${delivery.id}`,
              "EmailWorkerService",
            );
            await this.deliveryRepository.updateDeliveryStatus(delivery.id, "failed");
            continue;
          }
          await this.emailClient.sendEmail({
            to: userEmail,
            subject: notification.type || "Notification",
            template: "notification",
            variables: { type: notification.type, message: notification.message },
          });

          // Mark delivery as sent
          await this.deliveryRepository.updateDeliveryStatus(
            delivery.id,
            "sent",
          );
          this.logger.log(
            `Email sent successfully for delivery ${delivery.id}`,
            "EmailWorkerService",
          );
        } catch (error: any) {
          this.logger.error(
            `Failed to send email for delivery ${delivery.id}: ${error.message}`,
            "EmailWorkerService",
          );
          await this.deliveryRepository.updateDeliveryStatus(
            delivery.id,
            "failed",
          );
        }
      }

      this.logger.log("Email processing completed", "EmailWorkerService");
    } catch (error: any) {
      this.logger.error(
        `Email processing failed: ${error.message}`,
        "EmailWorkerService",
      );
    }
  }

}

