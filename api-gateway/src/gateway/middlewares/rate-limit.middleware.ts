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

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly storeOptions: Record<string, any>;

  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly rateLimitConfigService: RateLimitConfigService,
  ) {
    const redisClient = getRedisClient();

    this.storeOptions = redisClient
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
  }

  use(req: Request, res: Response, next: NextFunction) {
    const limiter = rateLimit({
      windowMs: this.rateLimitConfigService.getWindowMs(),
      max: this.rateLimitConfigService.getMaxRequests(),
      message: "Too many requests from this IP, please try again later.",
      standardHeaders: true,
      legacyHeaders: false,
      ...this.storeOptions,
      keyGenerator: (req: Request) => {
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
    limiter(req, res, next);
  }
}

