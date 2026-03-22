import { Injectable, Inject, LoggerService } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { firstValueFrom } from 'rxjs';
import { servicesConfig, routingConfig } from '../config/services.config';
import {
  GatewayTimeoutException,
  ServiceUnavailableException,
} from '../../common/exceptions/http.exceptions';

@Injectable()
export class GatewayService {
  constructor(
    private readonly httpService: HttpService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) { }

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
        this.logger.error(
          `No service configuration found for path: ${path}`,
          'GatewayService',
        );
        throw new ServiceUnavailableException('Service not available');
      }

      // Strip /api/v1 prefix if present (microservices don't have this prefix)
      const cleanPath = path.startsWith('/api/v1')
        ? path.replace('/api/v1', '')
        : path;

      // Apply optional path prefix strip (e.g. /user/auth/* → /auth/*)
      const rewrittenPath = serviceConfig.stripPrefix
        ? cleanPath.replace(serviceConfig.stripPrefix, '')
        : cleanPath;

      const targetUrl = `${serviceConfig.url}${rewrittenPath}`;

      this.logger.log(
        `Forwarding ${method} ${path} to ${serviceConfig.name} (${targetUrl})`,
        'GatewayService',
      );

      // Prepare request config
      const config: AxiosRequestConfig = {
        method: method as any,
        url: targetUrl,
        headers: this.prepareHeaders(headers, user),
        timeout: 30000, // 30 seconds timeout
      };

      if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        config.data = body;
      }

      if (queryParams && Object.keys(queryParams).length > 0) {
        config.params = queryParams;
      }

      // Make request to microservice
      const response = await firstValueFrom(
        this.httpService.request(config),
      );

      this.logger.log(
        `Response from ${serviceConfig.name}: ${response.status}`,
        'GatewayService',
      );

      return response;
    } catch (error) {
      this.logger.error(
        `Error forwarding request: ${error.message}`,
        error.stack,
        'GatewayService',
      );

      if (error.code === 'ECONNREFUSED') {
        throw new ServiceUnavailableException('Service temporarily unavailable');
      }

      if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
        throw new GatewayTimeoutException('Service request timeout');
      }

      // Re-throw the error with status from microservice if available
      if (error.response) {
        const { status, data } = error.response;
        const serviceError: any = new Error(data.message || 'Service error');
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

    // Add user context headers from decoded JWT
    if (user) {
      // Extract user information from JWT payload
      sanitized['x-user-id'] = user.userId || user.sub || user.id || '';
      sanitized['x-user-email'] = user.email || '';
      sanitized['x-user-role'] = user.role || 'user';

      // Optional: Add other user fields if present
      if (user.name) {
        sanitized['x-user-name'] = user.name;
      }
      if (user.phone) {
        sanitized['x-user-phone'] = user.phone;
      }
      if (user.providerId) {
        sanitized['x-provider-id'] = user.providerId;
      }

      this.logger.log(
        `Added user context headers: userId=${sanitized['x-user-id']}, role=${sanitized['x-user-role']}`,
        'GatewayService',
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
