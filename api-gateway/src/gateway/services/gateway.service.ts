import { Injectable, Inject, LoggerService, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';
import { servicesConfig, routingConfig } from '../config/services.config';
import {
  GatewayTimeoutException,
  ServiceUnavailableException,
} from '../../common/exceptions/http.exceptions';

@Injectable()
export class GatewayService {
  private readonly gatewaySecret: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {
    this.gatewaySecret = this.configService.get<string>('GATEWAY_INTERNAL_SECRET', '');
  }

  /**
   * Forward request to appropriate microservice
   */
  async forwardRequest(
    path: string,
    method: string,
    body?: any,
    headers?: any,
    queryParams?: any,
    user?: any,
  ): Promise<AxiosResponse> {
    try {
			const serviceName = this.getServiceName(path);
			const serviceConfig = servicesConfig[serviceName];

			if (!serviceConfig) {
				this.logger.warn(`No service configuration found for path: ${path}`, "GatewayService");
				throw new NotFoundException(`No resource found at ${path}`);
			}

			// Strip /api/v1 prefix if present (microservices don't have this prefix)
			const cleanPath = path.startsWith("/api/v1") ? path.replace("/api/v1", "") : path;

			// Apply optional path prefix strip (e.g. /user/auth/* → /auth/*)
			const rewrittenPath = serviceConfig.stripPrefix ? cleanPath.replace(serviceConfig.stripPrefix, "") : cleanPath;

			const targetUrl = `${serviceConfig.url}${rewrittenPath}`;

			this.logger.log(`[${headers?.['x-request-id'] || 'no-rid'}] Forwarding ${method} ${path} to ${serviceConfig.name} (${targetUrl})`, "GatewayService");

			// Prepare request config
			const config: AxiosRequestConfig = {
				method: method as any,
				url: targetUrl,
				headers: this.prepareHeaders(headers, user),
				timeout: 30000, // 30 seconds timeout
				maxRedirects: 0, // Never follow redirects — pass them through to the browser (needed for OAuth flows)
				validateStatus: () => true, // Never throw on any HTTP status — let the controller handle it
			};

			if (body && (method === "POST" || method === "PUT" || method === "PATCH")) {
				config.data = body;
			}

			if (queryParams && Object.keys(queryParams).length > 0) {
				config.params = queryParams;
			}

			// Make request to microservice
			const response = await firstValueFrom(this.httpService.request(config));

			this.logger.log(`Response from ${serviceConfig.name}: ${response.status}`, "GatewayService");

			return response;
		} catch (error) {
			this.logger.error(`Error forwarding request: ${error.message}`, error.stack, "GatewayService");

			// Preserve known gateway exceptions (e.g., unmapped route)
			if (error instanceof ServiceUnavailableException || error instanceof GatewayTimeoutException) {
				throw error;
			}

			if (error.code === "ECONNREFUSED") {
				throw new ServiceUnavailableException("Service temporarily unavailable");
			}

			if (error.code === "ETIMEDOUT" || error.message.includes("timeout")) {
				throw new GatewayTimeoutException("Service request timeout");
			}

			// Re-throw the error with status from microservice if available
			if (error.response) {
				const { status, data } = error.response;
				const responseMessage = typeof data === "string" ? data : data?.message;
				const serviceError: any = new Error(responseMessage || "Service error");
				serviceError.status = status;
				serviceError.response = data;
				throw serviceError;
			}

			throw error;
		}
  }

  /**
   * Determine service name based on request path
   */
  private getServiceName(path: string): string {
    // Strip /api/v1 prefix if present (added by global prefix in main.ts)
    const cleanPath = path.startsWith('/api/v1')
      ? path.replace('/api/v1', '')
      : path;

    for (const [route, service] of Object.entries(routingConfig)) {
      if (cleanPath.startsWith(route)) {
        return service;
      }
    }

    this.logger.warn(
      `No route mapping found for path: ${path} (cleaned: ${cleanPath})`,
      'GatewayService',
    );
    throw new ServiceUnavailableException('Route not configured');
  }

  /**
   * Prepare headers before forwarding
   * Remove gateway-specific headers and add user context
   */
  private prepareHeaders(headers: any, user?: any): any {
    if (!headers) {
      headers = {};
    }

    const sanitized = { ...headers };

    // Remove headers that should not be forwarded
    delete sanitized.host;
    delete sanitized.connection;
    delete sanitized['content-length'];
    delete sanitized['accept-encoding'];

    // Generate or forward request ID for distributed tracing
    if (!sanitized['x-request-id']) {
      sanitized['x-request-id'] = crypto.randomUUID();
    }

    // Add user context headers from decoded JWT
    if (user) {
			// Extract user information from JWT payload
			sanitized["x-user-id"] = user.userId || user.sub || user.id || "";
			sanitized["x-user-email"] = user.email || "";
			sanitized["x-user-role"] = user.role || "user";

			// Optional: Add other user fields if present
			if (user.name) {
				sanitized["x-user-name"] = user.name;
			}
			if (user.phone) {
				sanitized["x-user-phone"] = user.phone;
			}
			if (user.providerId) {
				sanitized["x-provider-id"] = user.providerId;
			}

			// Sign user context headers with HMAC to prevent tampering
			if (this.gatewaySecret) {
				const hmacPayload = `${sanitized["x-user-id"]}:${sanitized["x-user-email"]}:${sanitized["x-user-role"]}`;
				sanitized["x-gateway-hmac"] = crypto
					.createHmac("sha256", this.gatewaySecret)
					.update(hmacPayload)
					.digest("hex");
			}

			this.logger.log(
				`Added user context headers: userId=${sanitized["x-user-id"]}, role=${sanitized["x-user-role"]}`,
				"GatewayService",
			);
		}

    return sanitized;
  }

  /**
   * Health check - ping all microservices
   */
  async healthCheck(): Promise<any> {
    const results = {};

    for (const [serviceName, config] of Object.entries(servicesConfig)) {
      try {
        const response = await firstValueFrom(
          this.httpService.get(`${config.url}/health`, { timeout: 5000 }),
        );
        results[serviceName] = {
          status: 'healthy',
          url: config.url,
          responseTime: response.headers['x-response-time'] || 'N/A',
        };
      } catch (error) {
        results[serviceName] = {
          status: 'unhealthy',
          url: config.url,
          error: error.message,
        };
      }
    }

    return results;
  }
}
