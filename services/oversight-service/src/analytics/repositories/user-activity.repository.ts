import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { UserActivityLog } from '../entities/user-activity-log.entity';
import { TrackActivityDto } from '../dto/track-activity.dto';

@Injectable()
export class UserActivityRepository {
  constructor(@Inject('DATABASE_POOL') private readonly pool: Pool) {}

  async trackActivity(trackActivityDto: TrackActivityDto): Promise<UserActivityLog> {
    const query = `
      INSERT INTO user_activity_logs (user_id, action, metadata, ip_address)
      VALUES ($1, $2, $3, $4)
      RETURNING id, user_id, action, metadata, ip_address, created_at
    `;

    const values = [
      trackActivityDto.user_id,
      trackActivityDto.action,
      trackActivityDto.metadata || null,
      trackActivityDto.ip_address || null,
    ];

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async getUserActivity(
    userId: string,
    limit: number = 100,
    offset: number = 0,
  ): Promise<UserActivityLog[]> {
    const query = `
      SELECT id, user_id, action, metadata, ip_address, created_at
      FROM user_activity_logs
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await this.pool.query(query, [userId, limit, offset]);
    return result.rows;
  }

  async getAllActivity(
    limit: number = 100,
    offset: number = 0,
  ): Promise<UserActivityLog[]> {
    const query = `
      SELECT id, user_id, action, metadata, ip_address, created_at
      FROM user_activity_logs
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;

    const result = await this.pool.query(query, [limit, offset]);
    return result.rows;
  }

  async getActivityByAction(
    action: string,
    limit: number = 100,
  ): Promise<UserActivityLog[]> {
    const query = `
      SELECT id, user_id, action, metadata, ip_address, created_at
      FROM user_activity_logs
      WHERE action = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;

    const result = await this.pool.query(query, [action, limit]);
    return result.rows;
  }

  async getActivityCount(): Promise<number> {
    const query = `SELECT COUNT(*) as count FROM user_activity_logs`;
    const result = await this.pool.query(query);
    return parseInt(result.rows[0].count) || 0;
  }

  async getUserActivityCount(userId: string): Promise<number> {
    const query = `SELECT COUNT(*) as count FROM user_activity_logs WHERE user_id = $1`;
    const result = await this.pool.query(query, [userId]);
    return parseInt(result.rows[0].count) || 0;
  }

  async deleteOlderThan(cutoff: Date): Promise<number> {
    const result = await this.pool.query(
      'DELETE FROM user_activity_logs WHERE created_at < $1',
      [cutoff],
    );
    return result.rowCount ?? 0;
  }
}
