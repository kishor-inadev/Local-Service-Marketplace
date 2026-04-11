import { Injectable, Inject } from "@nestjs/common";
import Redis from "ioredis";
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";
import { LoggerService } from "@nestjs/common";

/**
 * TokenBlacklistService - Redis-backed token revocation
 * 
 * Provides immediate token invalidation by maintaining a blacklist
 * of revoked tokens in Redis. Tokens expire automatically after their
 * original expiration time.
 * 
 * Used for:
 * - User logout (revoke current token)
 * - Security incidents (revoke all user tokens)
 * - Password reset (invalidate all sessions)
 * - Account suspension (block all access)
 */
@Injectable()
export class TokenBlacklistService {
  constructor(
    @Inject("REDIS_CLIENT") private readonly redis: Redis,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  /**
   * Add a token to the blacklist
   * @param token - JWT token to revoke
   * @param expiresIn - Time in seconds until token would naturally expire
   */
  async revokeToken(token: string, expiresIn: number): Promise<void> {
    const key = `blacklist:token:${token}`;
    
    try {
      // Store with TTL matching token expiration
      await this.redis.setex(key, expiresIn, "revoked");
      
      this.logger.log(
        `Token revoked (expires in ${expiresIn}s)`,
        "TokenBlacklistService",
      );
    } catch (error) {
      this.logger.error(
        `Failed to revoke token: ${error.message}`,
        error.stack,
        "TokenBlacklistService",
      );
      throw error;
    }
  }

  /**
   * Check if a token is blacklisted
   */
  async isTokenRevoked(token: string): Promise<boolean> {
    const key = `blacklist:token:${token}`;
    
    try {
      const result = await this.redis.get(key);
      return result === "revoked";
    } catch (error) {
      this.logger.error(
        `Failed to check token blacklist: ${error.message}`,
        error.stack,
        "TokenBlacklistService",
      );
      // Fail open - allow request if Redis is down
      return false;
    }
  }

  /**
   * Revoke all tokens for a user (e.g., password reset, account suspension)
   * Uses a user-level blacklist that checks user ID
   */
  async revokeAllUserTokens(userId: string, expiresIn: number): Promise<void> {
    const key = `blacklist:user:${userId}`;
    
    try {
      // Store user-level revocation
      await this.redis.setex(key, expiresIn, Date.now().toString());
      
      this.logger.log(
        `All tokens revoked for user ${userId}`,
        "TokenBlacklistService",
      );
    } catch (error) {
      this.logger.error(
        `Failed to revoke user tokens: ${error.message}`,
        error.stack,
        "TokenBlacklistService",
      );
      throw error;
    }
  }

  /**
   * Check if all user tokens are revoked
   * Also checks if revocation happened after token was issued
   */
  async areUserTokensRevoked(
    userId: string,
    tokenIssuedAt: number,
  ): Promise<boolean> {
    const key = `blacklist:user:${userId}`;
    
    try {
      const revokedAt = await this.redis.get(key);
      
      if (!revokedAt) {
        return false;
      }
      
      // Token is invalid if it was issued before revocation
      return parseInt(revokedAt, 10) > tokenIssuedAt;
    } catch (error) {
      this.logger.error(
        `Failed to check user blacklist: ${error.message}`,
        error.stack,
        "TokenBlacklistService",
      );
      // Fail open
      return false;
    }
  }

  /**
   * Get statistics about blacklisted tokens
   */
  async getBlacklistStats(): Promise<{
    totalTokens: number;
    totalUsers: number;
  }> {
    try {
      const tokenKeys = await this.redis.keys("blacklist:token:*");
      const userKeys = await this.redis.keys("blacklist:user:*");
      
      return {
        totalTokens: tokenKeys.length,
        totalUsers: userKeys.length,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get blacklist stats: ${error.message}`,
        error.stack,
        "TokenBlacklistService",
      );
      return { totalTokens: 0, totalUsers: 0 };
    }
  }

  /**
   * Cleanup expired blacklist entries (should run periodically)
   * Redis handles TTL automatically, but this can force cleanup
   */
  async cleanup(): Promise<number> {
    try {
      // Redis automatically removes expired keys, so this is mostly for monitoring
      const stats = await this.getBlacklistStats();
      
      this.logger.log(
        `Blacklist contains ${stats.totalTokens} tokens, ${stats.totalUsers} users`,
        "TokenBlacklistService",
      );
      
      return stats.totalTokens + stats.totalUsers;
    } catch (error) {
      this.logger.error(
        `Failed to cleanup blacklist: ${error.message}`,
        error.stack,
        "TokenBlacklistService",
      );
      return 0;
    }
  }
}
