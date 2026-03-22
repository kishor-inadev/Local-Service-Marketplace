import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { Dispute } from '../entities/dispute.entity';

@Injectable()
export class DisputeRepository {
  constructor(@Inject('DATABASE_POOL') private readonly pool: Pool) {}

  async getDisputeById(id: string): Promise<Dispute | null> {
    const query = `
      SELECT id, job_id, opened_by, reason, status, 
             resolution, resolved_by, resolved_at, created_at
      FROM disputes
      WHERE id = $1
    `;

    const result = await this.pool.query(query, [id]);
    return result.rows[0] || null;
  }

  async getAllDisputes(
    limit: number = 50,
    offset: number = 0,
  ): Promise<Dispute[]> {
    const query = `
      SELECT id, job_id, opened_by, reason, status, 
             resolution, resolved_by, resolved_at, created_at
      FROM disputes
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;

    const result = await this.pool.query(query, [limit, offset]);
    return result.rows;
  }

  async getDisputesByStatus(status: string): Promise<Dispute[]> {
    const query = `
      SELECT id, job_id, opened_by, reason, status, 
             resolution, resolved_by, resolved_at, created_at
      FROM disputes
      WHERE status = $1
      ORDER BY created_at DESC
    `;

    const result = await this.pool.query(query, [status]);
    return result.rows;
  }

  async updateDispute(
    id: string,
    status: string,
    resolution: string,
    resolvedBy: string,
  ): Promise<Dispute> {
    const query = `
      UPDATE disputes
      SET status = $1, resolution = $2, resolved_by = $3, resolved_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING id, job_id, opened_by, reason, status, 
                resolution, resolved_by, resolved_at, created_at
    `;

    const values = [status, resolution, resolvedBy, id];
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async getDisputeCount(): Promise<number> {
    const query = `SELECT COUNT(*) as count FROM disputes`;
    const result = await this.pool.query(query);
    return parseInt(result.rows[0].count) || 0;
  }
}
