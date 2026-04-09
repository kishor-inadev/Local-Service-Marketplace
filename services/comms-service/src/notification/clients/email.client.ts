import { Injectable, Inject, LoggerService } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";
import axios, { AxiosInstance } from "axios";

@Injectable()
export class EmailClient {
  private readonly httpClient: AxiosInstance;
  private readonly emailServiceUrl: string;
  private readonly emailEnabled: boolean;

  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly configService: ConfigService,
  ) {
    this.emailServiceUrl = this.configService.get<string>(
      "EMAIL_SERVICE_URL",
      "http://email-service:3500",
    );
    this.emailEnabled =
      this.configService.get<string>("EMAIL_ENABLED", "true") === "true";

    this.httpClient = axios.create({
      baseURL: this.emailServiceUrl,
      timeout: this.configService.get<number>("REQUEST_TIMEOUT_MS", 72000),
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.logger.log(
      `EmailClient initialized - URL: ${this.emailServiceUrl}, Enabled: ${this.emailEnabled}`,
      "EmailClient",
    );
  }

  async sendEmail(options: {
    to: string;
    subject: string;
    text?: string;
    html?: string;
    template?: string;
    variables?: Record<string, any>;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.emailEnabled) {
      this.logger.warn(
        "Email service is disabled. Skipping email send.",
        "EmailClient",
      );
      return { success: false, error: "Email service disabled" };
    }

    try {
      this.logger.log(`Sending email to ${options.to}`, "EmailClient");

      const response = await this.httpClient.post("/send-email", {
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        template: options.template,
        variables: options.variables,
      });

      this.logger.log(
        `Email sent successfully to ${options.to}`,
        "EmailClient",
      );
      return { success: true, messageId: response.data?.messageId };
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${options.to}: ${error.message}`,
        error.stack,
        "EmailClient",
      );
      return { success: false, error: error.message };
    }
  }

  async sendTemplateEmail(
    to: string,
    template: string,
    variables: Record<string, any>,
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.emailEnabled) {
      this.logger.warn(
        "Email service is disabled. Skipping template email send.",
        "EmailClient",
      );
      return { success: false, error: "Email service disabled" };
    }

    try {
      this.logger.log(
        `Sending template email (${template}) to ${to}`,
        "EmailClient",
      );

      const response = await this.httpClient.post("/send-email", {
        to,
        template,
        variables,
      });

      this.logger.log(
        `Template email sent successfully to ${to}`,
        "EmailClient",
      );
      return { success: true, messageId: response.data?.messageId };
    } catch (error) {
      this.logger.error(
        `Failed to send template email to ${to}: ${error.message}`,
        error.stack,
        "EmailClient",
      );
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if email service is available
   */
  async healthCheck(): Promise<boolean> {
    if (!this.emailEnabled) {
      return false;
    }

    try {
      await this.httpClient.get("/health");
      return true;
    } catch (error) {
      this.logger.error(
        `Email service health check failed: ${error.message}`,
        "EmailClient",
      );
      return false;
    }
  }
}
