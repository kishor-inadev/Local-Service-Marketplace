import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { DATABASE_POOL } from '@/common/database/database.module';
import { EmailVerificationToken } from '../entities/email-verification-token.entity';

@Injectable()
export class EmailVerificationTokenRepository {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async create(userId: string, token: string, expiresAt: Date): Promise<EmailVerificationToken> {
    const query = `
      INSERT INTO email_verification_tokens (user_id, token, expires_at)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const result = await this.pool.query(query, [userId, token, expiresAt]);
    return result.rows[0];
  }

  async findByToken(token: string): Promise<EmailVerificationToken | null> {
    const query = 'SELECT * FROM email_verification_tokens WHERE token = $1';
    const result = await this.pool.query(query, [token]);
    return result.rows[0] || null;
  }

  async deleteByToken(token: string): Promise<void> {
    const query = 'DELETE FROM email_verification_tokens WHERE token = $1';
    await this.pool.query(query, [token]);
  }

  async deleteByUserId(userId: string): Promise<void> {
    const query = 'DELETE FROM email_verification_tokens WHERE user_id = $1';
    await this.pool.query(query, [userId]);
  }

  async deleteExpired(): Promise<void> {
    const query = 'DELETE FROM email_verification_tokens WHERE expires_at < NOW()';
    await this.pool.query(query);
  }
}
