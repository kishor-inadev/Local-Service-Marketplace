import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export interface SendEmailNotificationOptions {
  to: string;
  template: string;
  variables: Record<string, any>;
}

export interface SendSmsNotificationOptions {
  phone: string;
  message: string;
  purpose?: string;
}

@Injectable()
export class NotificationClient {
  private readonly logger = new Logger(NotificationClient.name);
  private readonly client: AxiosInstance;
  private readonly emailEnabled: boolean;
  private readonly smsEnabled: boolean;

  constructor(private configService: ConfigService) {
    const notificationServiceUrl = this.configService.get<string>(
      'NOTIFICATION_SERVICE_URL',
      'http://comms-service:3007',
    );
    this.emailEnabled = this.configService.get<string>('EMAIL_ENABLED', 'true') === 'true';
    this.smsEnabled = this.configService.get<string>('SMS_ENABLED', 'false') === 'true';

    this.client = axios.create({
      baseURL: notificationServiceUrl,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.logger.log(
      `NotificationClient initialized - Service: ${notificationServiceUrl}, Email: ${this.emailEnabled}, SMS: ${this.smsEnabled}`,
    );
  }

  async sendEmail(options: SendEmailNotificationOptions): Promise<boolean> {
    if (!this.emailEnabled) {
      this.logger.debug('Email notifications disabled, skipping email send');
      return false;
    }

    try {
      this.logger.log(`Sending email to ${options.to} using template ${options.template}`);

      await this.client.post('/notifications/email/send', {
        to: options.to,
        template: options.template,
        variables: options.variables,
      });

      this.logger.log(`Email sent successfully to ${options.to}`);
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${options.to}: ${error.message}`,
        error.stack,
      );
      return false;
    }
  }

  async sendSms(options: SendSmsNotificationOptions): Promise<boolean> {
    if (!this.smsEnabled) {
      this.logger.debug('SMS notifications disabled, skipping SMS send');
      return false;
    }

    try {
      this.logger.log(`Sending SMS to ${options.phone}`);

      await this.client.post('/notifications/sms/send', {
        phone: options.phone,
        message: options.message,
        purpose: options.purpose || 'notification',
      });

      this.logger.log(`SMS sent successfully to ${options.phone}`);
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send SMS to ${options.phone}: ${error.message}`,
        error.stack,
      );
      return false;
    }
  }

  async sendBoth(
    email: SendEmailNotificationOptions,
    sms: SendSmsNotificationOptions,
  ): Promise<{ emailSent: boolean; smsSent: boolean }> {
    const [emailSent, smsSent] = await Promise.all([
      this.sendEmail(email),
      this.sendSms(sms),
    ]);

    return { emailSent, smsSent };
  }

  isEmailEnabled(): boolean {
    return this.emailEnabled;
  }

  isSmsEnabled(): boolean {
    return this.smsEnabled;
  }
}
