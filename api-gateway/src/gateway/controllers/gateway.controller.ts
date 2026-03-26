import {
  Controller,
  All,
  Req,
  Res,
  Param,
  Inject,
  LoggerService,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { GatewayService } from '../services/gateway.service';

@Controller('api/v1')
export class GatewayController {
  constructor(
    private readonly gatewayService: GatewayService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  /**
   * Catch-all route handler
   * Forwards all requests to appropriate microservices
   */
  @All('*')
  async handleRequest(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const { method, path, body, headers, query } = req;

      this.logger.log(
        `Gateway received ${method} ${path}`,
        'GatewayController',
      );

      // Forward request to microservice with user context
      const response = await this.gatewayService.forwardRequest(
        path,
        method,
        body,
        headers,
        query,
        (req as any).user, // Pass decoded JWT user info
      );

      // Forward response headers from microservice
      if (response.headers) {
        Object.keys(response.headers).forEach((key) => {
          // Skip certain headers that shouldn't be forwarded
          if (
            ![
              'content-encoding',
              'transfer-encoding',
              'connection',
              'keep-alive',
            ].includes(key.toLowerCase())
          ) {
            res.setHeader(key, response.headers[key]);
          }
        });
      }

      // Microservices now return standardized responses, pass them through as-is
      res.status(response.status).json(response.data);
    } catch (error) {
      this.logger.error(
        `Gateway error: ${error.message}`,
        error.stack,
        'GatewayController',
      );

      // Handle error responses in standardized format
      const status = error.status || 500;
      const message =
        error.response?.message || error.message || 'Internal server error';

      // Send standardized error response
      res
				.status(status)
				.json({
					success: false,
					statusCode: status,
					message: message,
					error: { code: this.getErrorCode(status), details: [] },
				});
    }
  }

  private getErrorCode(status: number): string {
    switch (status) {
      case 400:
        return 'BAD_REQUEST';
      case 401:
        return 'UNAUTHORIZED';
      case 403:
        return 'FORBIDDEN';
      case 404:
        return 'NOT_FOUND';
      case 409:
        return 'CONFLICT';
      case 422:
        return 'VALIDATION_ERROR';
      case 429:
        return 'RATE_LIMIT_EXCEEDED';
      case 500:
        return 'INTERNAL_ERROR';
      case 503:
        return 'SERVICE_UNAVAILABLE';
      case 504:
        return 'GATEWAY_TIMEOUT';
      default:
        return 'UNKNOWN_ERROR';
    }
  }
}
