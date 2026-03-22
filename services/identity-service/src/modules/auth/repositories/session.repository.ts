import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { DATABASE_POOL } from '@/common/database/database.module';
import { Session } from '../entities/session.entity';

@Injectable()
export class SessionRepository {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async create(
    userId: string,
    refreshToken: string,
    expiresAt: Date,
    ipAddress?: string,
    userAgent?: string,
    deviceType?: string,        // ✅ NEW
    location?: string,          // ✅ NEW
  ): Promise<Session> {
    const query = `
      INSERT INTO sessions (
        user_id, refresh_token, expires_at, ip_address, 
        user_agent, device_type, location
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const result = await this.pool.query(query, [
      userId,
      refreshToken,
      expiresAt,
      ipAddress,
      userAgent,
      deviceType,               // ✅ NEW
      location,                 // ✅ NEW
    ]);
    return result.rows[0];
  }

  async findByRefreshToken(refreshToken: string): Promise<Session | null> {
    const query = 'SELECT * FROM sessions WHERE refresh_token = $1';
    const result = await this.pool.query(query, [refreshToken]);
    return result.rows[0] || null;
  }

  async findByUserId(userId: string): Promise<Session[]> {
    const query = 'SELECT * FROM sessions WHERE user_id = $1 ORDER BY created_at DESC';
    const result = await this.pool.query(query, [userId]);
    return result.rows;
  }

  async deleteByRefreshToken(refreshToken: string): Promise<void> {
    const query = 'DELETE FROM sessions WHERE refresh_token = $1';
    await this.pool.query(query, [refreshToken]);
  }

  async deleteByUserId(userId: string): Promise<void> {
    const query = 'DELETE FROM sessions WHERE user_id = $1';
    await this.pool.query(query, [userId]);
  }

  async deleteExpired(): Promise<void> {
    const query = 'DELETE FROM sessions WHERE expires_at < NOW()';
    await this.pool.query(query);
  }

  // ✅ NEW: Advanced query methods
  async getSessionsByDeviceType(
    userId: string, 
    deviceType: string
  ): Promise<Session[]> {
    const query = `
      SELECT * FROM sessions
      WHERE user_id = $1 
        AND device_type = $2
        AND expires_at > NOW()
      ORDER BY created_at DESC
    `;
    const result = await this.pool.query(query, [userId, deviceType]);
    return result.rows;
  }

  async getSessionsByLocation(
    userId: string, 
    location: string
  ): Promise<Session[]> {
    const query = `
      SELECT * FROM sessions
      WHERE user_id = $1 
        AND location = $2
        AND expires_at > NOW()
      ORDER BY created_at DESC
    `;
    const result = await this.pool.query(query, [userId, location]);
    return result.rows;
  }

  async getActiveSessions(userId: string): Promise<Session[]> {
    const query = `
      SELECT * FROM sessions
      WHERE user_id = $1 
        AND expires_at > NOW()
      ORDER BY created_at DESC
    `;
    const result = await this.pool.query(query, [userId]);
    return result.rows;
  }
}
