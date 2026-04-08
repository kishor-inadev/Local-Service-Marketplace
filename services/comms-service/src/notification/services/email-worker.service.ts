import { Injectable, Inject, LoggerService } from "@nestjs/common";
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";
import { NotificationDeliveryRepository } from "../repositories/notification-delivery.repository";
import { NotificationRepository } from "../repositories/notification.repository";

@Injectable()
export class EmailWorkerService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly deliveryRepository: NotificationDeliveryRepository,
    private readonly notificationRepository: NotificationRepository,
  ) {}

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

          // Simulate sending email (in production, integrate with email service like SendGrid, AWS SES)
          await this.sendEmail(
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
            `Email sent successfully for delivery ${delivery.id}`,
            "EmailWorkerService",
          );
        } catch (error) {
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
    } catch (error) {
      this.logger.error(
        `Email processing failed: ${error.message}`,
        "EmailWorkerService",
      );
    }
  }

  private async sendEmail(
    userId: string,
    type: string,
    message: string,
  ): Promise<void> {
    // Simulate email sending with delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    // In production, integrate with email service provider:
    // const emailService = new SendGrid(process.env.SENDGRID_API_KEY);
    // await emailService.send({
    //   to: userEmail,
    //   from: 'noreply@marketplace.com',
    //   subject: `Notification: ${type}`,
    //   text: message,
    // });

    this.logger.log(
      `Email sent to user ${userId} with type ${type}`,
      "EmailWorkerService",
    );
  }
}
