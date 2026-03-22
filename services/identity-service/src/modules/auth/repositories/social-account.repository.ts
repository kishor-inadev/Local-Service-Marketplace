import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { SocialAccount } from '../entities/social-account.entity';

@Injectable()
export class SocialAccountRepository {
  constructor(
    @Inject('DATABASE_POOL') private readonly pool: Pool,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  /**
   * Find social account by provider and provider user ID
   */
  async findByProvider(
    provider: string,
    providerUserId: string,
  ): Promise<SocialAccount | null> {
    try {
      const result = await this.pool.query<SocialAccount>(
        `SELECT * FROM social_accounts 
         WHERE provider = $1 AND provider_user_id = $2`,
        [provider, providerUserId],
      );
      return result.rows[0] || null;
    } catch (error) {
      this.logger.error('Error finding social account by provider', {
        context: 'SocialAccountRepository',
        error,
        provider,
        providerUserId,
      });
      throw error;
    }
  }

  /**
   * Find all social accounts for a user
   */
  async findByUserId(userId: string): Promise<SocialAccount[]> {
    try {
      const result = await this.pool.query<SocialAccount>(
        `SELECT * FROM social_accounts WHERE user_id = $1`,
        [userId],
      );
      return result.rows;
    } catch (error) {
      this.logger.error('Error finding social accounts by user ID', {
        context: 'SocialAccountRepository',
        error,
        userId,
      });
      throw error;
    }
  }

  /**
   * Create a new social account link
   */
  async create(
    userId: string,
    provider: string,
    providerUserId: string,
    accessToken?: string,
    refreshToken?: string,
  ): Promise<SocialAccount> {
    try {
      const result = await this.pool.query<SocialAccount>(
        `INSERT INTO social_accounts 
         (user_id, provider, provider_user_id, access_token, refresh_token) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING *`,
        [userId, provider, providerUserId, accessToken, refreshToken],
      );
      
      this.logger.info('Social account created', {
        context: 'SocialAccountRepository',
        userId,
        provider,
      });

      return result.rows[0];
    } catch (error) {
      this.logger.error('Error creating social account', {
        context: 'SocialAccountRepository',
        error,
        userId,
        provider,
      });
      throw error;
    }
  }

  /**
   * Update social account tokens
   */
  async updateTokens(
    id: string,
    accessToken: string,
    refreshToken?: string,
  ): Promise<void> {
    try {
      await this.pool.query(
        `UPDATE social_accounts 
         SET access_token = $1, refresh_token = $2 
         WHERE id = $3`,
        [accessToken, refreshToken, id],
      );

      this.logger.info('Social account tokens updated', {
        context: 'SocialAccountRepository',
        id,
      });
    } catch (error) {
      this.logger.error('Error updating social account tokens', {
        context: 'SocialAccountRepository',
        error,
        id,
      });
      throw error;
    }
  }

  /**
   * Unlink a social account
   */
  async delete(userId: string, provider: string): Promise<void> {
    try {
      await this.pool.query(
        `DELETE FROM social_accounts 
         WHERE user_id = $1 AND provider = $2`,
        [userId, provider],
      );

      this.logger.info('Social account unlinked', {
        context: 'SocialAccountRepository',
        userId,
        provider,
      });
    } catch (error) {
      this.logger.error('Error deleting social account', {
        context: 'SocialAccountRepository',
        error,
        userId,
        provider,
      });
      throw error;
    }
  }
}
