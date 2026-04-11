import { Injectable, Inject, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { RateLimitRepository } from '../repositories/rate-limit.repository';
import { RedisService } from '../../redis/redis.service';

@Injectable()
export class RateLimitService {
  private readonly RATE_LIMIT_WINDOW = 60; // 60 seconds window
  private readonly MAX_REQUESTS = 100; // Max requests per window

  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly rateLimitRepository: RateLimitRepository,
    private readonly redisService: RedisService,
  ) { }

  async checkRateLimit(
    key: string,
    maxRequests: number = this.MAX_REQUESTS,
    windowSeconds: number = this.RATE_LIMIT_WINDOW,
  ): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
    try {
      // Try Redis first for faster lookups
      const redisKey = `rate_limit:${key}`;
      const currentCount = await this.redisService.get(redisKey);

      if (currentCount) {
        const count = parseInt(currentCount);

        if (count >= maxRequests) {
          const client = this.redisService.getClient();
          const ttl = client ? await client.ttl(redisKey) : 0;
          const resetAt = new Date(Date.now() + ttl * 1000);

          this.logger.log(
            `Rate limit exceeded for key: ${key}`,
            'RateLimitService',
          );

          return {
            allowed: false,
            remaining: 0,
            resetAt,
          };
        }

        // Increment counter
        await this.redisService.incr(redisKey);

        return {
          allowed: true,
          remaining: maxRequests - count - 1,
          resetAt: new Date(Date.now() + windowSeconds * 1000),
        };
      }

      // First request - create new rate limit in Redis
      await this.redisService.set(redisKey, '1', windowSeconds);

      this.logger.log(
        `Rate limit initialized for key: ${key}`,
        'RateLimitService',
      );

      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetAt: new Date(Date.now() + windowSeconds * 1000),
      };
    } catch (error: any) {
      this.logger.error(
        `Failed to check rate limit: ${error.message}`,
        error.stack,
        'RateLimitService',
      );
      // On error, allow request to prevent blocking legitimate traffic
      return {
        allowed: true,
        remaining: maxRequests,
        resetAt: new Date(Date.now() + windowSeconds * 1000),
      };
    }
  }

  async resetRateLimit(key: string): Promise<void> {
    try {
      const redisKey = `rate_limit:${key}`;
      await this.redisService.del(redisKey);
      await this.rateLimitRepository.deleteRateLimit(key);

      this.logger.log(
        `Rate limit reset for key: ${key}`,
        'RateLimitService',
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to reset rate limit: ${error.message}`,
        error.stack,
        'RateLimitService',
      );
      throw error;
    }
  }

  async cleanupExpiredLimits(): Promise<void> {
    try {
      const expiryTime = new Date(Date.now() - this.RATE_LIMIT_WINDOW * 1000);
      await this.rateLimitRepository.deleteExpiredRateLimits(expiryTime);

      this.logger.log(
        'Cleaned up expired rate limits',
        'RateLimitService',
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to cleanup expired limits: ${error.message}`,
        error.stack,
        'RateLimitService',
      );
      throw error;
    }
  }
}
