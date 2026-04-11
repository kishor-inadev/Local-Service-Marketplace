import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios, { AxiosInstance } from "axios";
import * as crypto from "crypto";

export interface UserData {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  role: string;
}

@Injectable()
export class UserClient {
  private readonly logger = new Logger(UserClient.name);
  private readonly httpClient: AxiosInstance;
  private readonly userServiceUrl: string;
  private readonly enabled: boolean;

  constructor(private readonly configService: ConfigService) {
    this.userServiceUrl = this.configService.get<string>(
      "USER_SERVICE_URL",
      "http://identity-service:3001",
    );
    this.enabled = this.configService.get<boolean>(
      "USER_SERVICE_ENABLED",
      true,
    );

    this.httpClient = axios.create({
      baseURL: this.userServiceUrl,
      timeout: this.configService.get<number>("REQUEST_TIMEOUT_MS", 72000),
      headers: { "Content-Type": "application/json" },
    });

    // Attach HMAC auth headers for service-to-service calls
    this.httpClient.interceptors.request.use((config) => {
      Object.assign(config.headers, this.getInternalHeaders());
      return config;
    });

    this.logger.log(`UserClient initialised — URL: ${this.userServiceUrl}`);
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

  async getUserById(userId: string): Promise<UserData | null> {
    if (!this.enabled) return null;
    try {
      const response = await this.httpClient.get<{ data: UserData }>(
        `/users/${userId}`,
      );
      return response.data?.data ?? null;
    } catch (error: any) {
      this.logger.warn(
        `UserClient.getUserById failed for ${userId}: ${error.message}`,
      );
      return null;
    }
  }

  /**
   * Resolves a user's email address from their UUID.
   * Returns null when the identity-service is unavailable or the user is not found.
   */
  async getUserEmail(userId: string): Promise<string | null> {
    const user = await this.getUserById(userId);
    return user?.email ?? null;
  }
}
