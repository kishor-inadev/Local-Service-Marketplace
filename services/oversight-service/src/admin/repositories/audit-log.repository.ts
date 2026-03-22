import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { AuditLog } from '../entities/audit-log.entity';

@Injectable()
export class AuditLogRepository {
  constructor(@Inject('DATABASE_POOL') private readonly pool: Pool) {}

  async createAuditLog(
    userId: string,
    action: string,
    entity: string,
    entityId: string,
    metadata?: any,
  ): Promise<AuditLog> {
    const query = `
      INSERT INTO audit_logs (user_id, action, entity, entity_id, metadata)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, user_id, action, entity, entity_id, metadata, created_at
    `;

    const values = [userId, action, entity, entityId, metadata || null];
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async getAuditLogs(
    limit: number = 100,
    offset: number = 0,
  ): Promise<AuditLog[]> {
    const query = `
      SELECT id, user_id, action, entity, entity_id, metadata, created_at
      FROM audit_logs
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;

    const result = await this.pool.query(query, [limit, offset]);
    return result.rows;
  }

  async getAuditLogsByUserId(userId: string): Promise<AuditLog[]> {
    const query = `
      SELECT id, user_id, action, entity, entity_id, metadata, created_at
      FROM audit_logs
      WHERE user_id = $1
      ORDER BY created_at DESC
    `;

    const result = await this.pool.query(query, [userId]);
    return result.rows;
  }

  async getAuditLogsByEntity(
    entity: string,
    entityId: string,
  ): Promise<AuditLog[]> {
    const query = `
      SELECT id, user_id, action, entity, entity_id, metadata, created_at
      FROM audit_logs
      WHERE entity = $1 AND entity_id = $2
      ORDER BY created_at DESC
    `;

    const result = await this.pool.query(query, [entity, entityId]);
    return result.rows;
  }

  async getAuditLogCount(): Promise<number> {
    const query = `SELECT COUNT(*) as count FROM audit_logs`;
    const result = await this.pool.query(query);
    return parseInt(result.rows[0].count) || 0;
  }
}
