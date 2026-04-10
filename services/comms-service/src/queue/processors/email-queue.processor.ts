/**
 * @deprecated
 * This file is kept for reference only.
 * Email delivery is now handled by EmailWorker in src/workers/email.worker.ts
 * which uses the @nestjs/bullmq WorkerHost pattern on queue "comms.email".
 */
export {};

export interface EmailJobData {
  deliveryId: string;
  notificationId: string;
  userId: string;
  type: string;
  message: string;
}

@Processor("email-queue")
export class EmailQueueProcessor {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly deliveryRepository: NotificationDeliveryRepository,
    private readonly notificationRepository: NotificationRepository,
  ) {}

  @Process("send-email")
  async handleSendEmail(job: Job<EmailJobData>): Promise<void> {
    const { deliveryId, notificationId, userId, type, message } = job.data;

    this.logger.log(
      `Processing email job for delivery ${deliveryId}`,
      "EmailQueueProcessor",
    );

    try {
      // Simulate email sending (integrate with SendGrid, AWS SES, etc. in production)
      await this.sendEmail(userId, type, message);

      // Mark delivery as sent
      await this.deliveryRepository.updateDeliveryStatus(deliveryId, "sent");

      this.logger.log(
        `Email sent successfully for delivery ${deliveryId}`,
        "EmailQueueProcessor",
      );
    } catch (error) {
      this.logger.error(
        `Failed to send email for delivery ${deliveryId}: ${error.message}`,
        error.stack,
        "EmailQueueProcessor",
      );

      // Mark delivery as failed
      await this.deliveryRepository.updateDeliveryStatus(deliveryId, "failed");

      // Rethrow to trigger Bull's retry mechanism
      throw error;
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
      "EmailQueueProcessor",
    );
  }
}
