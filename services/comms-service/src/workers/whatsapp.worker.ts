import { Processor, WorkerHost, OnWorkerEvent } from "@nestjs/bullmq";
import { Inject, LoggerService, Optional } from "@nestjs/common";
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";
import { Job } from "bullmq";
import { WhatsAppClient } from "../notification/clients/whatsapp.client";
import { NotificationDeliveryRepository } from "../notification/repositories/notification-delivery.repository";
import { DeadLetterQueueService } from "../common/dlq/dead-letter-queue.service";

export interface DeliverWhatsAppJobData {
  phone: string;
  message: string;
  deliveryId?: string;
  templateName?: string;
  templateParams?: string[];
}

export interface DeliverWhatsAppOtpJobData {
  phone: string;
  otp: string;
  deliveryId?: string;
}

/**
 * WhatsAppWorker — consumes the "comms.whatsapp" queue.
 *
 * Handles:
 *   deliver-whatsapp      : send a plain / template WhatsApp message
 *   deliver-whatsapp-otp  : send an OTP via WhatsApp
 */
@Processor("comms.whatsapp", {
  concurrency: parseInt(process.env.WORKER_CONCURRENCY || "5", 10),
})
export class WhatsAppWorker extends WorkerHost {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly whatsAppClient: WhatsAppClient,
    private readonly deliveryRepository: NotificationDeliveryRepository,
    @Optional() private readonly dlqService?: DeadLetterQueueService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case "deliver-whatsapp":
        return this.handleDeliverWhatsApp(job as Job<DeliverWhatsAppJobData>);
      case "deliver-whatsapp-otp":
        return this.handleDeliverOtp(job as Job<DeliverWhatsAppOtpJobData>);
      default:
        this.logger.warn(
          `WhatsAppWorker: unknown job name "${job.name}"`,
          "WhatsAppWorker",
        );
    }
  }

  // ─────────────────────────────────────────────────────────────────

  private async handleDeliverWhatsApp(
    job: Job<DeliverWhatsAppJobData>,
  ): Promise<void> {
    const { phone, message, deliveryId, templateName, templateParams } =
      job.data;

    this.logger.log(
      `WhatsAppWorker: sending message to ${phone} (attempt ${job.attemptsMade + 1})`,
      "WhatsAppWorker",
    );

    try {
      const result = await this.whatsAppClient.sendText({
        to: phone,
        body: message,
        templateName,
        templateParams,
      });

      if (deliveryId) {
        await this.deliveryRepository.updateDeliveryStatus(
          deliveryId,
          result.success ? "sent" : "failed",
        );
      }

      if (!result.success) {
        throw new Error(result.error || "WhatsApp send returned failure");
      }

      this.logger.log(
        `WhatsAppWorker: message sent to ${phone}, id: ${result.messageId}`,
        "WhatsAppWorker",
      );
    } catch (error: any) {
      if (deliveryId) {
        await this.deliveryRepository
          .updateDeliveryStatus(deliveryId, "failed")
          .catch(() => undefined);
      }
      if (this.dlqService && job.attemptsMade >= 3) {
        await this.dlqService.captureFailedJob("comms.whatsapp", job, error);
      }
      this.logger.error(
        `WhatsAppWorker: failed to send to ${phone}: ${error.message}`,
        error.stack,
        "WhatsAppWorker",
      );
      throw error;
    }
  }

  private async handleDeliverOtp(
    job: Job<DeliverWhatsAppOtpJobData>,
  ): Promise<void> {
    const { phone, otp, deliveryId } = job.data;

    this.logger.log(
      `WhatsAppWorker: sending OTP to ${phone} (attempt ${job.attemptsMade + 1})`,
      "WhatsAppWorker",
    );

    try {
      const result = await this.whatsAppClient.sendOtp(phone, otp);

      if (deliveryId) {
        await this.deliveryRepository.updateDeliveryStatus(
          deliveryId,
          result.success ? "sent" : "failed",
        );
      }

      if (!result.success) {
        throw new Error(result.error || "WhatsApp OTP send returned failure");
      }

      this.logger.log(
        `WhatsAppWorker: OTP sent to ${phone}, id: ${result.messageId}`,
        "WhatsAppWorker",
      );
    } catch (error: any) {
      if (deliveryId) {
        await this.deliveryRepository
          .updateDeliveryStatus(deliveryId, "failed")
          .catch(() => undefined);
      }
      if (this.dlqService && job.attemptsMade >= 3) {
        await this.dlqService.captureFailedJob("comms.whatsapp", job, error);
      }
      this.logger.error(
        `WhatsAppWorker: OTP send failed for ${phone}: ${error.message}`,
        error.stack,
        "WhatsAppWorker",
      );
      throw error;
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // Worker lifecycle hooks
  // ─────────────────────────────────────────────────────────────────

  @OnWorkerEvent("active")
  onActive(job: Job): void {
    this.logger.log(
      `Job "${job.name}/${job.id}" started (attempt ${job.attemptsMade + 1})`,
      "WhatsAppWorker",
    );
  }

  @OnWorkerEvent("completed")
  onCompleted(job: Job): void {
    this.logger.log(
      `Job "${job.name}/${job.id}" completed`,
      "WhatsAppWorker",
    );
  }

  @OnWorkerEvent("failed")
  onFailed(job: Job | undefined, error: Error): void {
    this.logger.error(
      `Job "${job?.name ?? "unknown"}/${job?.id ?? "?'}"} failed (attempt ${job?.attemptsMade ?? 0}): ${error.message}`,
      error.stack,
      "WhatsAppWorker",
    );
  }

  @OnWorkerEvent("error")
  onError(error: Error): void {
    this.logger.error(
      `Worker error: ${error.message}`,
      error.stack,
      "WhatsAppWorker",
    );
  }

  @OnWorkerEvent("stalled")
  onStalled(jobId: string): void {
    this.logger.warn(`Job ${jobId} stalled and will be requeued`, "WhatsAppWorker");
  }
}
