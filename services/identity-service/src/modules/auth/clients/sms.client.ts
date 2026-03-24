import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

interface OtpSendResponse {
  success: boolean;
  message: string;
  expiresAt?: string;
}

interface OtpVerifyResponse {
  success: boolean;
  valid: boolean;
  message: string;
}

/**
 * SmsClient - HTTP client for sending SMS via notification-service
 * 
 * This client calls the notification-service, which routes to sms-service.
 * This architecture centralizes notification management without requiring
 * Redis/Kafka or other event infrastructure.
 * 
 * Flow: auth-service → notification-service → sms-service
 */
@Injectable()
export class SmsClient {
  private readonly logger = new Logger(SmsClient.name);
  private readonly client: AxiosInstance;
  private readonly enabled: boolean;

  constructor(private configService: ConfigService) {
    const notificationServiceUrl = this.configService.get<string>(
      'NOTIFICATION_SERVICE_URL',
      'http://comms-service:3007'
    );
    this.enabled = this.configService.get<string>('SMS_ENABLED') === 'true';

    if (this.enabled && !notificationServiceUrl) {
      this.logger.warn('SMS_ENABLED=true but NOTIFICATION_SERVICE_URL not configured');
    }

    this.client = axios.create({
      baseURL: notificationServiceUrl,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.logger.log(
      `SmsClient initialized - Notification Service: ${notificationServiceUrl}, SMS Enabled: ${this.enabled}`,
    );
  }

  async sendOtp(phone: string, purpose: string = 'login'): Promise<OtpSendResponse> {
    if (!this.enabled) {
      this.logger.debug('SMS service is disabled, skipping OTP send');
      return {
        success: false,
        message: 'SMS service is disabled',
      };
    }

    try {
      this.logger.log(`Sending OTP to ${phone} via notification-service (purpose: ${purpose})`);
      
      const response = await this.client.post<OtpSendResponse>('/notifications/otp/send', {
        phone,
        purpose,
      });
      
      this.logger.log('OTP sent successfully');
      return response.data;
    } catch (error) {
      this.logger.error('Failed to send OTP', error.response?.data || error.message);
      throw new Error(`Notification service error: ${error.message}`);
    }
  }

  async verifyOtp(phone: string, code: string, purpose: string = 'login'): Promise<OtpVerifyResponse> {
    if (!this.enabled) {
      this.logger.debug('SMS service is disabled, skipping OTP verification');
      return {
        success: false,
        valid: false,
        message: 'SMS service is disabled',
      };
    }

    try {
      this.logger.log(`Verifying OTP for ${phone} via notification-service`);
      
      const response = await this.client.post<OtpVerifyResponse>('/notifications/otp/verify', {
        phone,
        code,
        purpose,
      });
      
      return response.data;
    } catch (error) {
      this.logger.error('Failed to verify OTP', error.response?.data || error.message);
      return {
        success: false,
        valid: false,
        message: error.response?.data?.message || 'Verification failed',
      };
    }
  }
}
