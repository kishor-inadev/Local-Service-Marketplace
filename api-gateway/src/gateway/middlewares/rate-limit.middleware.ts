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

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private limiter: any;

  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {
    const redisClient = getRedisClient();

    const storeOptions = redisClient
      ? {
          store: new RedisStore({
            sendCommand: (...args: string[]) =>
              (redisClient as any).call(...args),
            prefix: "rl:general:",
          }),
        }
      : {};

    if (redisClient) {
      this.logger.log("Rate limiter using Redis store", "RateLimitMiddleware");
    } else {
      this.logger.warn(
        "Rate limiter using in-memory store (Redis not configured)",
        "RateLimitMiddleware",
      );
    }

    // Configure rate limiter
    this.limiter = rateLimit({
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000, // 1 minute
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 100 requests per window
      message: "Too many requests from this IP, please try again later.",
      standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
      legacyHeaders: false, // Disable the `X-RateLimit-*` headers
      ...storeOptions,
      keyGenerator: (req: Request) => {
        // Use user ID if authenticated, otherwise use IP
        const user = (req as any).user;
        return user?.userId || req.ip;
      },
      handler: (req: Request, res: Response) => {
        const message = "Too many requests, please try again later.";
        this.logger.warn(
          `Rate limit exceeded for ${(req as any).user?.userId || req.ip} on ${req.originalUrl}`,
          "RateLimitMiddleware",
        );
        res.status(429).json({
          success: false,
          statusCode: 429,
          message,
          error: { code: "RATE_LIMIT_EXCEEDED", message, details: [] },
        });
      },
    });
  }

  use(req: Request, res: Response, next: NextFunction) {
    this.limiter(req, res, next);
  }
}
