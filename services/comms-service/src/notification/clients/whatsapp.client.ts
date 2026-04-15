import { Injectable, Inject, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import axios, { AxiosInstance } from 'axios';

export interface WhatsAppTextMessage {
  to: string;        // E.164 phone number e.g. +919876543210
  body: string;      // Plain text message
  templateName?: string;
  templateParams?: string[];
}

export interface WhatsAppSendResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * WhatsApp Business API client.
 * Supports official Meta Cloud API and Twilio WhatsApp.
 * Falls back to no-op when WHATSAPP_ENABLED=false (default).
 */
@Injectable()
export class WhatsAppClient {
  private readonly httpClient: AxiosInstance;
  private readonly enabled: boolean;
  private readonly provider: 'meta' | 'twilio' | 'mock';

  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly configService: ConfigService,
  ) {
    this.enabled =
      this.configService.get<string>('WHATSAPP_ENABLED', 'false') === 'true';

    this.provider = (this.configService.get<string>(
      'WHATSAPP_PROVIDER',
      'mock',
    ) || 'mock') as 'meta' | 'twilio' | 'mock';

    const baseUrl =
      this.provider === 'meta'
        ? `https://graph.facebook.com/v19.0/${this.configService.get<string>('WHATSAPP_PHONE_NUMBER_ID')}/messages`
        : this.provider === 'twilio'
          ? `https://api.twilio.com/2010-04-01/Accounts/${this.configService.get<string>('TWILIO_ACCOUNT_SID')}/Messages`
          : 'http://localhost:0'; // no-op for mock

    const token =
      this.provider === 'meta'
        ? this.configService.get<string>('WHATSAPP_ACCESS_TOKEN', '')
        : this.provider === 'twilio'
          ? Buffer.from(
              `${this.configService.get<string>('TWILIO_ACCOUNT_SID')}:${this.configService.get<string>('TWILIO_AUTH_TOKEN')}`,
            ).toString('base64')
          : '';

    this.httpClient = axios.create({
      baseURL: baseUrl,
      timeout: 10_000,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    this.logger.log(
      `WhatsAppClient initialized — provider: ${this.provider}, enabled: ${this.enabled}`,
      'WhatsAppClient',
    );
  }

  async sendText(msg: WhatsAppTextMessage): Promise<WhatsAppSendResponse> {
    if (!this.enabled) {
      this.logger.warn(
        `WhatsApp disabled — would have sent to ${msg.to}: ${msg.body}`,
        'WhatsAppClient',
      );
      return { success: false, error: 'WhatsApp disabled' };
    }

    try {
      let payload: Record<string, unknown>;

      if (this.provider === 'meta') {
        payload = msg.templateName
          ? {
              messaging_product: 'whatsapp',
              to: msg.to,
              type: 'template',
              template: {
                name: msg.templateName,
                language: { code: 'en_IN' },
                components:
                  msg.templateParams?.length
                    ? [
                        {
                          type: 'body',
                          parameters: msg.templateParams.map((p) => ({
                            type: 'text',
                            text: p,
                          })),
                        },
                      ]
                    : [],
              },
            }
          : {
              messaging_product: 'whatsapp',
              to: msg.to,
              type: 'text',
              text: { preview_url: false, body: msg.body },
            };
      } else {
        // Twilio WhatsApp form format
        payload = {
          From: `whatsapp:${this.configService.get<string>('TWILIO_WHATSAPP_FROM')}`,
          To: `whatsapp:${msg.to}`,
          Body: msg.body,
        };
      }

      const response = await this.httpClient.post('', payload);
      const messageId =
        response.data?.messages?.[0]?.id || response.data?.sid;

      this.logger.log(
        `WhatsApp message sent to ${msg.to}, id: ${messageId}`,
        'WhatsAppClient',
      );
      return { success: true, messageId };
    } catch (error: any) {
      this.logger.error(
        `WhatsApp send failed to ${msg.to}: ${error.message}`,
        error.stack,
        'WhatsAppClient',
      );
      return { success: false, error: error.message };
    }
  }

  async sendOtp(phone: string, otp: string): Promise<WhatsAppSendResponse> {
    return this.sendText({
      to: phone,
      body: `[Local Service Marketplace] Your OTP is *${otp}*. Valid for 10 minutes. Do not share this with anyone.`,
      templateName: this.configService.get<string>('WHATSAPP_OTP_TEMPLATE_NAME'),
      templateParams: [otp],
    });
  }
}
