import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios, { AxiosInstance } from "axios";

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
      timeout: 5000,
      headers: { "Content-Type": "application/json" },
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

  async getUserById(userId: string): Promise<UserData | null> {
    if (!this.enabled) {
      return null;
    }

    try {
      const response = await this.httpClient.get(`/api/v1/users/${userId}`);
      return response.data as UserData;
    } catch (error) {
      this.logger.error(`Failed to fetch user ${userId}: ${error.message}`);
      return null;
    }
  }

  async getUserEmail(userId: string): Promise<string | null> {
    const user = await this.getUserById(userId);
    return user?.email || null;
  }

  async getProviderById(providerId: string): Promise<ProviderData | null> {
    if (!this.enabled) {
      return null;
    }

    try {
      const response = await this.httpClient.get(
        `/api/v1/providers/${providerId}`,
      );
      return response.data as ProviderData;
    } catch (error) {
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
    } catch (error) {
      this.logger.error(`User service health check failed: ${error.message}`);
      return false;
    }
  }
}
