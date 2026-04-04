import { Injectable, NestMiddleware, Inject, LoggerService } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { getRedisClient } from '../../common/redis/redis.provider';

/**
 * Stricter rate limiter applied only to authentication endpoints.
 *
 * Defaults:
 *   - 10 requests per 15 minutes per IP (generous for normal use, tight enough to slow brute-force)
 *   - Configurable via AUTH_RATE_LIMIT_MAX and AUTH_RATE_LIMIT_WINDOW_MS env vars
 *
 * Applied in GatewayModule to:
 *   /user/auth/login
 *   /user/auth/register
 *   /user/auth/refresh
 *   /user/auth/forgot-password
 *   /user/auth/reset-password
 *   /user/auth/verify-otp
 */
@Injectable()
export class AuthRateLimitMiddleware implements NestMiddleware {
  private limiter: ReturnType<typeof rateLimit>;

  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {
    const windowMs = parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS ?? '900000'); // 15 min
    const max = parseInt(process.env.AUTH_RATE_LIMIT_MAX ?? '10'); // 10 attempts

    const redisClient = getRedisClient();

    const storeOptions = redisClient
      ? { store: new RedisStore({ sendCommand: (...args: string[]) => (redisClient as any).call(...args), prefix: 'rl:auth:' }) }
      : {};

    this.limiter = rateLimit({
      windowMs,
      max,
      message: 'Too many authentication attempts. Please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
      // Always key by IP for auth endpoints — never by user ID (unauthenticated at this point)
      keyGenerator: (req: Request) => req.ip ?? 'unknown',
      handler: (req: Request, res: Response) => {
        const message = 'Too many authentication attempts. Please try again later.';
        this.logger.warn(
          `Auth rate limit exceeded for IP ${req.ip} on ${req.originalUrl}`,
          'AuthRateLimitMiddleware',
        );
        res.status(429).json({
          success: false,
          statusCode: 429,
          message,
          error: { code: 'AUTH_RATE_LIMIT_EXCEEDED', message, details: [] },
        });
      },
    });
  }

  use(req: Request, res: Response, next: NextFunction) {
    this.limiter(req, res, next);
  }
}
