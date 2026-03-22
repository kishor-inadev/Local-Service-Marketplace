import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { DATABASE_POOL } from '@/common/database/database.module';
import { PasswordResetToken } from '../entities/password-reset-token.entity';

@Injectable()
export class PasswordResetTokenRepository {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async create(userId: string, token: string, expiresAt: Date): Promise<PasswordResetToken> {
    const query = `
      INSERT INTO password_reset_tokens (user_id, token, expires_at)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const result = await this.pool.query(query, [userId, token, expiresAt]);
    return result.rows[0];
  }

  async findByToken(token: string): Promise<PasswordResetToken | null> {
    const query = 'SELECT * FROM password_reset_tokens WHERE token = $1';
    const result = await this.pool.query(query, [token]);
    return result.rows[0] || null;
  }

  async deleteByToken(token: string): Promise<void> {
    const query = 'DELETE FROM password_reset_tokens WHERE token = $1';
    await this.pool.query(query, [token]);
  }

  async deleteByUserId(userId: string): Promise<void> {
    const query = 'DELETE FROM password_reset_tokens WHERE user_id = $1';
    await this.pool.query(query, [userId]);
  }

  async deleteExpired(): Promise<void> {
    const query = 'DELETE FROM password_reset_tokens WHERE expires_at < NOW()';
    await this.pool.query(query);
  }
}
