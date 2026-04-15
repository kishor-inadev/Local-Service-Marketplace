import {
  Injectable,
  NestMiddleware,
  Inject,
  LoggerService,
} from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";
import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { getRedisClient } from "../../common/redis/redis.provider";
import { RateLimitConfigService } from "../services/rate-limit-config.service";

/**
 * Stricter rate limiter applied only to authentication endpoints.
 * Values are loaded from system_settings via RateLimitConfigService (polled every 60s).
 * Env-var fallbacks: AUTH_RATE_LIMIT_MAX (default 10), AUTH_RATE_LIMIT_WINDOW_MS (default 900000).
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
  private readonly storeOptions: Record<string, any>;
  private readonly windowMs: number;

  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly rateLimitConfigService: RateLimitConfigService,
  ) {
    // Window is less critical to make dynamic — keep from env; only max is dynamic
    this.windowMs = parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS ?? "900000");

    const redisClient = getRedisClient();
    this.storeOptions = redisClient
      ? {
          store: new RedisStore({
            sendCommand: (...args: string[]) =>
              (redisClient as any).call(...args),
            prefix: "rl:auth:",
          }),
        }
      : {};
  }

  use(req: Request, res: Response, next: NextFunction) {
    const limiter = rateLimit({
      windowMs: this.windowMs,
      max: this.rateLimitConfigService.getAuthMaxRequests(),
      message: "Too many authentication attempts. Please try again later.",
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req: Request) => req.ip ?? "unknown",
      handler: (req: Request, res: Response) => {
        const message =
          "Too many authentication attempts. Please try again later.";
        this.logger.warn(
          `Auth rate limit exceeded for IP ${req.ip} on ${req.originalUrl}`,
          "AuthRateLimitMiddleware",
        );
        res.status(429).json({
          success: false,
          statusCode: 429,
          message,
          error: { code: "AUTH_RATE_LIMIT_EXCEEDED", message, details: [] },
        });
      },
      ...this.storeOptions,
    });
    limiter(req, res, next);
  }
}

