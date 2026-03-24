import { Injectable, Inject, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import axios, { AxiosInstance } from 'axios';

export interface OtpSendResponse {
  success: boolean;
  message: string;
  expiresAt?: string;
}

export interface OtpVerifyResponse {
  success: boolean;
  valid: boolean;
  message: string;
}

@Injectable()
export class SmsClient {
  private readonly httpClient: AxiosInstance;
  private readonly smsServiceUrl: string;
  private readonly smsEnabled: boolean;
  private readonly smsApiKey: string;

  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
    private readonly configService: ConfigService,
  ) {
    this.smsServiceUrl = this.configService.get<string>('SMS_SERVICE_URL', 'http://sms-service:3000');
    this.smsEnabled = this.configService.get<string>('SMS_ENABLED', 'false') === 'true';
    this.smsApiKey = this.configService.get<string>('SMS_API_KEY', '');

    this.httpClient = axios.create({
      baseURL: this.smsServiceUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.smsApiKey,
      },
    });

    this.logger.log(
      `SmsClient initialized - URL: ${this.smsServiceUrl}, Enabled: ${this.smsEnabled}`,
      'SmsClient',
    );
  }

  async sendSms(
    phone: string,
    message: string,
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.smsEnabled) {
      this.logger.warn('SMS service is disabled. Skipping SMS send.', 'SmsClient');
      return { success: false, error: 'SMS service disabled' };
    }

    try {
      this.logger.log(`Sending SMS to ${phone}`, 'SmsClient');

      const response = await this.httpClient.post('/sms/send', {
        phone,
        message,
      });

      this.logger.log(`SMS sent successfully to ${phone}`, 'SmsClient');
      return { success: true, messageId: response.data?.messageId };
    } catch (error) {
      this.logger.error(
        `Failed to send SMS to ${phone}: ${error.message}`,
        error.stack,
        'SmsClient',
      );
      return { success: false, error: error.message };
    }
  }

  async sendOtp(phone: string, purpose: string = 'login'): Promise<OtpSendResponse> {
    if (!this.smsEnabled) {
      this.logger.warn('SMS service is disabled. Skipping OTP send.', 'SmsClient');
      return {
        success: false,
        message: 'SMS service is disabled. Cannot send OTP.',
      };
    }

    try {
      this.logger.log(`Requesting OTP for phone ${phone} (purpose: ${purpose})`, 'SmsClient');

      const response = await this.httpClient.post("/sms/send-otp", { phone, purpose });

      this.logger.log(`OTP sent successfully to ${phone}`, 'SmsClient');
      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to send OTP to ${phone}: ${error.message}`,
        error.stack,
        'SmsClient',
      );
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to send OTP',
      };
    }
  }

  async verifyOtp(phone: string, code: string, purpose: string = 'login'): Promise<OtpVerifyResponse> {
    if (!this.smsEnabled) {
      this.logger.warn('SMS service is disabled. Skipping OTP verification.', 'SmsClient');
      return {
        success: false,
        valid: false,
        message: 'SMS service is disabled. Cannot verify OTP.',
      };
    }

    try {
      this.logger.log(`Verifying OTP for phone ${phone} (purpose: ${purpose})`, 'SmsClient');

      const response = await this.httpClient.post("/sms/verify-otp", { phone, code, purpose });

      this.logger.log(`OTP verification result for ${phone}: ${response.data.valid}`, 'SmsClient');
      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to verify OTP for ${phone}: ${error.message}`,
        error.stack,
        'SmsClient',
      );
      return {
        success: false,
        valid: false,
        message: error.response?.data?.message || 'Failed to verify OTP',
      };
    }
  }

  /**
   * Check if SMS service is available
   */
  async healthCheck(): Promise<boolean> {
    if (!this.smsEnabled) {
      return false;
    }

    try {
      await this.httpClient.get('/health');
      return true;
    } catch (error) {
      this.logger.error(`SMS service health check failed: ${error.message}`, 'SmsClient');
      return false;
    }
  }
}
