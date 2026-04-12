import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios, { AxiosInstance } from "axios";
import * as crypto from "crypto";

export interface JobData {
  id: string;
  customer_id: string;
  provider_id: string;
  status: string;
  actual_amount?: number;
  proposal_id?: string;
}

@Injectable()
export class JobClient {
  private readonly logger = new Logger(JobClient.name);
  private readonly httpClient: AxiosInstance;
  private readonly marketplaceUrl: string;
  private readonly enabled: boolean;

  constructor(private configService: ConfigService) {
    this.marketplaceUrl = this.configService.get<string>(
      "MARKETPLACE_SERVICE_URL",
      "http://marketplace-service:3003",
    );
    this.enabled = this.configService.get<boolean>(
      "MARKETPLACE_SERVICE_ENABLED",
      true,
    );

    this.httpClient = axios.create({
      baseURL: this.marketplaceUrl,
      timeout: this.configService.get<number>("REQUEST_TIMEOUT_MS", 72000),
      headers: { "Content-Type": "application/json" },
    });

    this.httpClient.interceptors.request.use((config) => {
      Object.assign(config.headers, this.getInternalHeaders());
      return config;
    });

    if (this.enabled) {
      this.logger.log(`JobClient initialized with URL: ${this.marketplaceUrl}`);
    } else {
      this.logger.warn("JobClient is disabled");
    }
  }

  private getInternalHeaders(): Record<string, string> {
    const userId = "00000000-0000-0000-0000-000000000001";
    const email = "internal@service.local";
    const role = "admin";
    const permissions = "jobs.read,jobs.manage";
    const headers: Record<string, string> = {
      "x-user-id": userId,
      "x-user-email": email,
      "x-user-role": role,
      "x-user-permissions": permissions,
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

  async getJobById(jobId: string): Promise<JobData | null> {
    if (!this.enabled) {
      return null;
    }

    try {
      const response = await this.httpClient.get(`/jobs/${jobId}`);
      return response.data as JobData;
    } catch (error: any) {
      this.logger.error(`Failed to fetch job ${jobId}: ${error.message}`);
      return null;
    }
  }
}
