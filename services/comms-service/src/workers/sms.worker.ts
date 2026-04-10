import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Job } from 'bullmq';
import { SmsClient } from '../notification/clients/sms.client';
import { NotificationDeliveryRepository } from '../notification/repositories/notification-delivery.repository';

export interface DeliverSmsJobData {
  phone: string;
  message: string;
  deliveryId?: string;
  purpose?: string;
}

export interface DeliverOtpJobData {
  phone: string;
  purpose: string;
}

/**
 * SmsWorker — consumes the "comms.sms" queue.
 *
 * Handles:
 *   deliver-sms  : send a plain SMS message
 *   deliver-otp  : send an OTP via SMS
 */
@Processor('comms.sms', {
  concurrency: parseInt(process.env.WORKER_CONCURRENCY || '5', 10),
})
export class SmsWorker extends WorkerHost {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly smsClient: SmsClient,
    private readonly deliveryRepository: NotificationDeliveryRepository,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case 'deliver-sms':
        return this.handleDeliverSms(job as Job<DeliverSmsJobData>);
      case 'deliver-otp':
        return this.handleDeliverOtp(job as Job<DeliverOtpJobData>);
      default:
        this.logger.warn(`SmsWorker: unknown job name "${job.name}"`, 'SmsWorker');
    }
  }

  // ─────────────────────────────────────────────────────────────────

  private async handleDeliverSms(job: Job<DeliverSmsJobData>): Promise<void> {
    const { phone, message, deliveryId } = job.data;

    this.logger.log(
      `SmsWorker: sending SMS to ${phone} (attempt ${job.attemptsMade + 1})`,
      'SmsWorker',
    );

    try {
      await this.smsClient.sendSms(phone, message);

      if (deliveryId) {
        await this.deliveryRepository.updateDeliveryStatus(deliveryId, 'sent');
      }

      this.logger.log(`SmsWorker: SMS sent to ${phone}`, 'SmsWorker');
    } catch (error) {
      this.logger.error(
        `SmsWorker: SMS to ${phone} failed — ${error.message}`,
        error.stack,
        'SmsWorker',
      );
      if (deliveryId) {
        await this.deliveryRepository.updateDeliveryStatus(deliveryId, 'failed');
      }
      throw error;
    }
  }

  private async handleDeliverOtp(job: Job<DeliverOtpJobData>): Promise<void> {
    const { phone, purpose } = job.data;

    this.logger.log(
      `SmsWorker: sending OTP to ${phone} (purpose: ${purpose}, attempt ${job.attemptsMade + 1})`,
      'SmsWorker',
    );

    try {
      await this.smsClient.sendOtp(phone, purpose);
      this.logger.log(`SmsWorker: OTP sent to ${phone}`, 'SmsWorker');
    } catch (error) {
      this.logger.error(
        `SmsWorker: OTP to ${phone} failed — ${error.message}`,
        error.stack,
        'SmsWorker',
      );
      throw error;
    }
  }
}
