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

export interface ProviderData {
  id: string;
  user_id: string;
  business_name: string;
  email?: string;
  phone?: string;
  verification_status?: string;
}

@Injectable()
export class UserClient {
  private readonly logger = new Logger(UserClient.name);
  private readonly httpClient: AxiosInstance;
  private readonly userServiceUrl: string;
  private readonly enabled: boolean;

  constructor(private configService: ConfigService) {
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

    // Attach gateway-compatible HMAC auth headers on every request
    this.httpClient.interceptors.request.use((config) => {
      Object.assign(config.headers, this.getInternalHeaders());
      return config;
    });

    if (this.enabled) {
      this.logger.log(
        `UserClient initialized with URL: ${this.userServiceUrl}`,
      );
    } else {
      this.logger.warn("UserClient is disabled");
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Generates gateway-compatible auth headers for service-to-service calls.
   * Uses a fixed internal service identity with admin role, signed with the
   * shared GATEWAY_INTERNAL_SECRET so the target service's JwtAuthGuard accepts it.
   */
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
    if (!this.enabled) {
      return null;
    }

    try {
      const response = await this.httpClient.get(`/users/${userId}`);
      return response.data as UserData;
    } catch (error: any) {
      this.logger.error(`Failed to fetch user ${userId}: ${error.message}`);
      return null;
    }
  }

  async getUserEmail(userId: string): Promise<string | null> {
    const user = await this.getUserById(userId);
    return user?.email || null;
  }

  async getUserName(userId: string): Promise<string | null> {
    const user = await this.getUserById(userId);
    return user?.name || user?.email?.split('@')[0] || null;
  }

  async getProviderById(providerId: string): Promise<ProviderData | null> {
    if (!this.enabled) {
      return null;
    }

    try {
      const response = await this.httpClient.get(
        `/providers/${providerId}`,
      );
      return response.data as ProviderData;
    } catch (error: any) {
      this.logger.error(
        `Failed to fetch provider ${providerId}: ${error.message}`,
      );
      return null;
    }
  }

  async getProviderEmail(providerId: string): Promise<string | null> {
    const provider = await this.getProviderById(providerId);
    if (!provider) return null;
    if (provider.email) return provider.email;
    if (provider.user_id) return this.getUserEmail(provider.user_id);
    return null;
  }

  async healthCheck(): Promise<boolean> {
    if (!this.enabled) {
      return false;
    }

    try {
      await this.httpClient.get("/health");
      return true;
    } catch (error: any) {
      this.logger.error(`User service health check failed: ${error.message}`);
      return false;
    }
  }
}
