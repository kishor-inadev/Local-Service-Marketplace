import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { AdminAction } from '../entities/admin-action.entity';

@Injectable()
export class AdminActionRepository {
  constructor(@Inject('DATABASE_POOL') private readonly pool: Pool) {}

  async createAdminAction(
    adminId: string,
    action: string,
    targetType: string,
    targetId: string,
    reason: string,
  ): Promise<AdminAction> {
    const query = `
      INSERT INTO admin_actions (admin_id, action, target_type, target_id, reason)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, display_id, admin_id, action, target_type, target_id, reason, created_at
    `;

    const values = [adminId, action, targetType, targetId, reason];
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async getAdminActions(
    limit: number = 50,
    offset: number = 0,
  ): Promise<AdminAction[]> {
    const query = `
      SELECT id, display_id, admin_id, action, target_type, target_id, reason, created_at
      FROM admin_actions
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;

    const result = await this.pool.query(query, [limit, offset]);
    return result.rows;
  }

  async getAdminActionsByAdminId(adminId: string): Promise<AdminAction[]> {
    const query = `
      SELECT id, display_id, admin_id, action, target_type, target_id, reason, created_at
      FROM admin_actions
      WHERE admin_id = $1
      ORDER BY created_at DESC
    `;

    const result = await this.pool.query(query, [adminId]);
    return result.rows;
  }
}
