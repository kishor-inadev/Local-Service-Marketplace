import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios, { AxiosInstance } from "axios";
import * as crypto from "crypto";

export interface SendEmailNotificationOptions {
  to: string;
  template: string;
  variables: Record<string, any>;
}

@Injectable()
export class NotificationClient {
  private readonly logger = new Logger(NotificationClient.name);
  private readonly client: AxiosInstance;
  private readonly emailEnabled: boolean;

  constructor(private configService: ConfigService) {
    const notificationServiceUrl = this.configService.get<string>(
      "NOTIFICATION_SERVICE_URL",
      "http://comms-service:3007",
    );
    this.emailEnabled =
      this.configService.get<string>("EMAIL_ENABLED", "true") === "true";

    this.client = axios.create({
      baseURL: notificationServiceUrl,
      timeout: this.configService.get<number>("REQUEST_TIMEOUT_MS", 72000),
      headers: { "Content-Type": "application/json" },
    });

    this.client.interceptors.request.use((config) => {
      Object.assign(config.headers, this.getInternalHeaders());
      return config;
    });

    this.logger.log(
      `NotificationClient initialized - Service: ${notificationServiceUrl}, Email: ${this.emailEnabled}`,
    );
  }

  private getInternalHeaders(): Record<string, string> {
    const userId = "00000000-0000-0000-0000-000000000001";
    const email = "internal@service.local";
    const role = "admin";
    const headers: Record<string, string> = {
      "x-user-id": userId,
      "x-user-email": email,
      "x-user-role": role,
    };
    const secret = process.env.GATEWAY_INTERNAL_SECRET;
    if (secret) {
      headers["x-gateway-hmac"] = crypto
        .createHmac("sha256", secret)
        .update(`${userId}:${email}:${role}`)
        .digest("hex");
    }
    return headers;
  }

  async sendEmail(options: SendEmailNotificationOptions): Promise<boolean> {
    if (!this.emailEnabled) {
      this.logger.debug("Email notifications disabled, skipping email send");
      return false;
    }

    try {
      this.logger.log(
        `Sending email to ${options.to} using template ${options.template}`,
      );

      await this.client.post("/notifications/email/send", {
        to: options.to,
        template: options.template,
        variables: options.variables,
      });

      this.logger.log(`Email sent successfully to ${options.to}`);
      return true;
    } catch (error: any) {
      this.logger.error(
        `Failed to send email to ${options.to}: ${error.message}`,
        error.stack,
      );
      return false;
    }
  }
}
