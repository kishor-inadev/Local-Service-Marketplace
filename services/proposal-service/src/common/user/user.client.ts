import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

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
      'USER_SERVICE_URL',
      'http://identity-service:3001',
    );
    this.enabled = this.configService.get<boolean>('USER_SERVICE_ENABLED', true);

    this.httpClient = axios.create({
      baseURL: this.userServiceUrl,
      timeout: 5000, // 5 second timeout
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (this.enabled) {
      this.logger.log(`UserClient initialized with URL: ${this.userServiceUrl}`);
    } else {
      this.logger.warn('UserClient is disabled');
    }
  }

  /**
   * Check if user service is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Get user data by user ID
   */
  async getUserById(userId: string): Promise<UserData | null> {
    if (!this.enabled) {
      this.logger.warn('UserClient is disabled, returning null');
      return null;
    }

    try {
      const response = await this.httpClient.get(`/api/v1/users/${userId}`);
      return response.data as UserData;
    } catch (error) {
      this.logger.error(
        `Failed to fetch user ${userId}: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }

  /**
   * Get provider data by provider ID
   */
  async getProviderById(providerId: string): Promise<ProviderData | null> {
    if (!this.enabled) {
      this.logger.warn('UserClient is disabled, returning null');
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
        error.stack,
      );
      return null;
    }
  }

  /**
   * Get user email by user ID (convenience method)
   */
  async getUserEmail(userId: string): Promise<string | null> {
    const user = await this.getUserById(userId);
    return user?.email || null;
  }

  /**
   * Get provider email by provider ID (convenience method)
   */
  async getProviderEmail(providerId: string): Promise<string | null> {
    const provider = await this.getProviderById(providerId);
    
    // Try to get email from provider, fallback to user email
    if (provider?.email) {
      return provider.email;
    }

    // If provider doesn't have email, fetch from user record
    if (provider?.user_id) {
      return this.getUserEmail(provider.user_id);
    }

    return null;
  }

  /**
   * Get multiple users in batch (for efficiency)
   */
  async getUsersByIds(userIds: string[]): Promise<Map<string, UserData>> {
    if (!this.enabled || userIds.length === 0) {
      return new Map();
    }

    try {
      const response = await this.httpClient.post('/api/v1/users/batch', {
        user_ids: userIds,
      });

      const users = response.data as UserData[];
      const userMap = new Map<string, UserData>();

      users.forEach((user) => {
        userMap.set(user.id, user);
      });

      return userMap;
    } catch (error) {
      this.logger.error(
        `Failed to fetch users in batch: ${error.message}`,
        error.stack,
      );
      return new Map();
    }
  }

  /**
   * Health check for user service
   */
  async healthCheck(): Promise<boolean> {
    if (!this.enabled) {
      return false;
    }

    try {
      await this.httpClient.get('/health');
      return true;
    } catch (error) {
      this.logger.error(
        `User service health check failed: ${error.message}`,
      );
      return false;
    }
  }
}
