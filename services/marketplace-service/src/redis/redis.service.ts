import {
  Injectable,
  OnModuleDestroy,
  Inject,
  LoggerService,
} from "@nestjs/common";
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";
import Redis from "ioredis";

@Injectable()
export class RedisService implements OnModuleDestroy {
  private redisClient: Redis;
  private cacheEnabled: boolean;

  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {
    this.cacheEnabled = process.env.CACHE_ENABLED === "true";

    if (this.cacheEnabled) {
      this.redisClient = new Redis({
        host: process.env.REDIS_HOST || "redis",
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
      });

      this.redisClient.on("connect", () => {
        this.logger.log("Redis cache connected successfully", "RedisService");
      });

      this.redisClient.on("error", (err: any) => {
        this.logger.error(
          `Redis connection error: ${err.message}`,
          err.stack,
          "RedisService",
        );
        this.cacheEnabled = false; // Disable cache on error
      });
    } else {
      this.logger.log("Redis cache is disabled", "RedisService");
    }
  }

  async onModuleDestroy() {
    if (this.redisClient) {
      await this.redisClient.quit();
    }
  }

  isCacheEnabled(): boolean {
    return this.cacheEnabled;
  }

  /**
   * Get value from cache
   */
  async get(key: string): Promise<string | null> {
    if (!this.cacheEnabled) return null;

    try {
      return await this.redisClient.get(key);
    } catch (error: any) {
      this.logger.error(
        `Redis GET error for key ${key}: ${error.message}`,
        error.stack,
        "RedisService",
      );
      return null;
    }
  }

  /**
   * Set value in cache with TTL (in seconds)
   */
  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (!this.cacheEnabled) return;

    try {
      if (ttl) {
        await this.redisClient.setex(key, ttl, value);
      } else {
        await this.redisClient.set(key, value);
      }
    } catch (error: any) {
      this.logger.error(
        `Redis SET error for key ${key}: ${error.message}`,
        error.stack,
        "RedisService",
      );
    }
  }

  /**
   * Delete key from cache
   */
  async del(key: string): Promise<void> {
    if (!this.cacheEnabled) return;

    try {
      await this.redisClient.del(key);
    } catch (error: any) {
      this.logger.error(
        `Redis DEL error for key ${key}: ${error.message}`,
        error.stack,
        "RedisService",
      );
    }
  }

  /**
   * Delete multiple keys matching a pattern using non-blocking SCAN (safe for production).
   * KEYS is O(N) and blocks all Redis operations; SCAN iterates incrementally.
   */
  async delPattern(pattern: string): Promise<void> {
    if (!this.cacheEnabled) return;

    try {
      let cursor = "0";
      do {
        const [nextCursor, keys] = await this.redisClient.scan(
          cursor,
          "MATCH",
          pattern,
          "COUNT",
          100,
        );
        cursor = nextCursor;
        if (keys.length > 0) {
          await this.redisClient.del(...keys);
        }
      } while (cursor !== "0");
    } catch (error: any) {
      this.logger.error(
        `Redis DEL pattern error for ${pattern}: ${error.message}`,
        error.stack,
        "RedisService",
      );
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    if (!this.cacheEnabled) return false;

    try {
      const result = await this.redisClient.exists(key);
      return result === 1;
    } catch (error: any) {
      this.logger.error(
        `Redis EXISTS error for key ${key}: ${error.message}`,
        error.stack,
        "RedisService",
      );
      return false;
    }
  }

  /**
   * Increment counter
   */
  async incr(key: string): Promise<number> {
    if (!this.cacheEnabled) return 0;

    try {
      return await this.redisClient.incr(key);
    } catch (error: any) {
      this.logger.error(
        `Redis INCR error for key ${key}: ${error.message}`,
        error.stack,
        "RedisService",
      );
      return 0;
    }
  }

  /**
   * Set expiration on a key
   */
  async expire(key: string, seconds: number): Promise<void> {
    if (!this.cacheEnabled) return;

    try {
      await this.redisClient.expire(key, seconds);
    } catch (error: any) {
      this.logger.error(
        `Redis EXPIRE error for key ${key}: ${error.message}`,
        error.stack,
        "RedisService",
      );
    }
  }
}
