import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { DATABASE_POOL } from '@/common/database/database.module';
import { LoginAttempt } from '../entities/login-attempt.entity';

@Injectable()
export class LoginAttemptRepository {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async create(
    email: string, 
    success: boolean, 
    ipAddress?: string,
    userAgent?: string,
    location?: string
  ): Promise<LoginAttempt> {
    const query = `
      INSERT INTO login_attempts (
        email, success, ip_address, user_agent, location, created_at
      )
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
    `;
    const result = await this.pool.query(query, [
      email, 
      success, 
      ipAddress,
      userAgent,
      location
    ]);
    return result.rows[0];
  }

  async countRecentFailedAttempts(email: string, windowMinutes: number = 15): Promise<number> {
    const query = `
      SELECT COUNT(*) as count
      FROM login_attempts
      WHERE email = $1 
        AND success = false 
        AND created_at > NOW() - ($2 * INTERVAL '1 minute')
    `;
    const result = await this.pool.query(query, [email, windowMinutes]);
    return parseInt(result.rows[0].count, 10);
  }

  async deleteOldAttempts(daysOld: number = 30): Promise<void> {
    const query = `
      DELETE FROM login_attempts 
      WHERE created_at < NOW() - ($1 * INTERVAL '1 day')
    `;
    await this.pool.query(query, [daysOld]);
  }

  // ✅ NEW: Advanced query methods
  async getFailedAttemptsByLocation(
    location: string, 
    minutes: number = 15
  ): Promise<number> {
    const query = `
      SELECT COUNT(*) as count
      FROM login_attempts
      WHERE location = $1
        AND success = false
        AND created_at > NOW() - ($2 * INTERVAL '1 minute')
    `;
    const result = await this.pool.query(query, [location, minutes]);
    return parseInt(result.rows[0].count, 10);
  }

  async getAttemptsByUserAgent(
    userAgent: string, 
    minutes: number = 60
  ): Promise<number> {
    const query = `
      SELECT COUNT(*) as count
      FROM login_attempts
      WHERE user_agent = $1
        AND created_at > NOW() - ($2 * INTERVAL '1 minute')
    `;
    const result = await this.pool.query(query, [userAgent, minutes]);
    return parseInt(result.rows[0].count, 10);
  }

  async getSuspiciousAttempts(minutes: number = 60, minAttempts: number = 10): Promise<LoginAttempt[]> {
    const query = `
      SELECT ip_address, COUNT(*) as attempt_count, 
             MAX(created_at) as last_attempt
      FROM login_attempts
      WHERE success = false
        AND created_at > NOW() - ($1 * INTERVAL '1 minute')
      GROUP BY ip_address
      HAVING COUNT(*) >= $2
      ORDER BY attempt_count DESC
    `;
    const result = await this.pool.query(query, [minutes, minAttempts]);
    return result.rows;
  }
}
