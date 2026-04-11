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
      const redisKey = `rate_limit:${key}`;

      // Atomic INCR: the new count is returned in a single round-trip.
      // If the key didn't exist before, Redis creates it with value 1.
      const newCount = await this.redisService.incr(redisKey);

      if (newCount === 1) {
        // First request in this window — set the expiry atomically on the same key.
        await this.redisService.expire(redisKey, windowSeconds);
      }

      const resetAt = new Date(Date.now() + windowSeconds * 1000);

      if (newCount > maxRequests) {
        // Fetch remaining TTL for a more accurate resetAt when the key already existed.
        const client = this.redisService.getClient();
        const ttl = client ? await client.ttl(redisKey) : windowSeconds;
        const accurateResetAt = new Date(Date.now() + ttl * 1000);

        this.logger.log(`Rate limit exceeded for key: ${key}`, 'RateLimitService');
        return { allowed: false, remaining: 0, resetAt: accurateResetAt };
      }

      return { allowed: true, remaining: maxRequests - newCount, resetAt };
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
