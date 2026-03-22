import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { SystemSetting } from '../entities/system-setting.entity';

@Injectable()
export class SystemSettingRepository {
  constructor(@Inject('DATABASE_POOL') private readonly pool: Pool) {}

  async getAllSettings(): Promise<SystemSetting[]> {
    const query = `
      SELECT key, value, description, updated_at as "updatedAt"
      FROM system_settings
      ORDER BY key
    `;

    const result = await this.pool.query(query);
    return result.rows;
  }

  async getSettingByKey(key: string): Promise<SystemSetting | null> {
    const query = `
      SELECT key, value, description, updated_at as "updatedAt"
      FROM system_settings
      WHERE key = $1
    `;

    const result = await this.pool.query(query, [key]);
    return result.rows[0] || null;
  }

  async updateSetting(key: string, value: string): Promise<SystemSetting> {
    const query = `
      UPDATE system_settings
      SET value = $1, updated_at = CURRENT_TIMESTAMP
      WHERE key = $2
      RETURNING key, value, description, updated_at as "updatedAt"
    `;

    const result = await this.pool.query(query, [value, key]);
    return result.rows[0];
  }

  async createSetting(
    key: string,
    value: string,
    description?: string,
  ): Promise<SystemSetting> {
    const query = `
      INSERT INTO system_settings (key, value, description)
      VALUES ($1, $2, $3)
      RETURNING key, value, description, updated_at as "updatedAt"
    `;

    const result = await this.pool.query(query, [key, value, description]);
    return result.rows[0];
  }
}
