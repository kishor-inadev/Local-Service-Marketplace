import { Injectable, Inject } from "@nestjs/common";
import { Pool } from "pg";

export interface UserDevice {
  id: string;
  user_id: string;
  device_id: string;
  device_type: string;
  os: string;
  last_seen: Date;
}

export interface RegisterDeviceDto {
  user_id: string;
  device_id: string;
  device_type?: string;
  os?: string;
}

/**
 * DeviceRepository - Manages user device tokens for push notifications
 * 
 * Table: user_devices
 */
@Injectable()
export class DeviceRepository {
  constructor(@Inject("DATABASE_POOL") private readonly pool: Pool) {}

  /**
   * Register or update a device token for a user
   * Upserts based on unique constraint (user_id, device_id)
   */
  async registerDevice(dto: RegisterDeviceDto): Promise<UserDevice> {
    const query = `
      INSERT INTO user_devices (user_id, device_id, device_type, os, last_seen)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (user_id, device_id) DO UPDATE SET
        device_type = EXCLUDED.device_type,
        os = EXCLUDED.os,
        last_seen = NOW()
      RETURNING *
    `;

    const result = await this.pool.query(query, [
      dto.user_id,
      dto.device_id,
      dto.device_type || null,
      dto.os || null,
    ]);

    return result.rows[0];
  }

  /**
   * Get all devices for a user (for multi-device push)
   */
  async getUserDevices(userId: string): Promise<UserDevice[]> {
    const query = `
      SELECT * FROM user_devices
      WHERE user_id = $1
      ORDER BY last_seen DESC
    `;

    const result = await this.pool.query(query, [userId]);
    return result.rows;
  }

  /**
   * Get a specific device by device_id
   */
  async getDeviceByDeviceId(deviceId: string): Promise<UserDevice | null> {
    const query = `
      SELECT * FROM user_devices
      WHERE device_id = $1
    `;

    const result = await this.pool.query(query, [deviceId]);
    return result.rows[0] || null;
  }

  /**
   * Remove a device token (user logs out or revokes permission)
   */
  async removeDevice(userId: string, deviceId: string): Promise<void> {
    const query = `
      DELETE FROM user_devices
      WHERE user_id = $1 AND device_id = $2
    `;

    await this.pool.query(query, [userId, deviceId]);
  }

  /**
   * Update last_seen timestamp (called when device connects)
   */
  async updateLastSeen(deviceId: string): Promise<void> {
    const query = `
      UPDATE user_devices
      SET last_seen = NOW()
      WHERE device_id = $1
    `;

    await this.pool.query(query, [deviceId]);
  }

  /**
   * Clean up stale devices (not seen in 90+ days)
   */
  async cleanupStaleDevices(daysOld: number = 90): Promise<number> {
    const query = `
      DELETE FROM user_devices
      WHERE last_seen < NOW() - INTERVAL '${daysOld} days'
    `;

    const result = await this.pool.query(query);
    return result.rowCount || 0;
  }
}
