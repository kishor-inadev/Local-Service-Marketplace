import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { SavedPaymentMethodRepository } from "../repositories/saved-payment-method.repository";
import { NotificationClient } from "../../common/notification/notification.client";

@Injectable()
export class PaymentMethodExpiryJob {
  private readonly logger = new Logger(PaymentMethodExpiryJob.name);

  constructor(
    private readonly paymentMethodRepository: SavedPaymentMethodRepository,
    private readonly notificationClient: NotificationClient,
  ) {}

  /**
   * Check for expiring payment methods daily at 11 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_11AM)
  async checkExpiringPaymentMethods(): Promise<void> {
    this.logger.log("Checking for expiring payment methods");

    try {
      const expiringMethods =
        await this.paymentMethodRepository.findExpiringWithinMonths(1);

      if (expiringMethods.length === 0) {
        this.logger.log("No expiring payment methods found");
        return;
      }

      const methodsByUser = new Map<string, typeof expiringMethods>();
      for (const method of expiringMethods) {
        const current = methodsByUser.get(method.user_id) || [];
        current.push(method);
        methodsByUser.set(method.user_id, current);
      }

      let notifiedUsers = 0;
      for (const [userId, methods] of methodsByUser.entries()) {
        const destinationEmail = methods.find(
          (method) => !!method.billing_email,
        )?.billing_email;
        if (!destinationEmail) {
          this.logger.warn(
            `Skipping expiry notification for user ${userId}: no billing email available`,
          );
          continue;
        }

        const maskedMethods = methods.map(
          (method) =>
            `${method.card_brand || "card"} ****${method.last_four || "----"}`,
        );
        const earliest = methods[0];

        const sent = await this.notificationClient.sendEmail({
          to: destinationEmail,
          template: "paymentMethodExpiryReminder",
          variables: {
            cardSummary: maskedMethods.join(", "),
            expiryMonth: earliest.expiry_month,
            expiryYear: earliest.expiry_year,
            methodsCount: methods.length,
          },
        });

        if (sent) {
          notifiedUsers += 1;
        }
      }

      this.logger.log(
        `Payment method expiry check completed. Expiring methods: ${expiringMethods.length}, users notified: ${notifiedUsers}`,
      );
    } catch (error) {
      this.logger.error(
        `Error checking expiring payment methods: ${error.message}`,
        error.stack,
      );
    }
  }
}
