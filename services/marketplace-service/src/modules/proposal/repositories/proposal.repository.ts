import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { Proposal } from '../entities/proposal.entity';
import { CreateProposalDto } from '../dto/create-proposal.dto';
import { ProposalQueryDto } from '../dto/proposal-query.dto';

@Injectable()
export class ProposalRepository {
  constructor(@Inject('DATABASE_POOL') private readonly pool: Pool) {}

  async createProposal(dto: CreateProposalDto): Promise<Proposal> {
    const query = `
      INSERT INTO proposals (
        request_id, provider_id, price, message, 
        estimated_hours, start_date, completion_date, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
      RETURNING *
    `;

    const values = [
      dto.request_id, 
      dto.provider_id, 
      dto.price, 
      dto.message,
      dto.estimated_hours || null,       // ✅ NEW
      dto.start_date || null,            // ✅ NEW
      dto.completion_date || null        // ✅ NEW
    ];

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async getProposalsForRequest(requestId: string, limit = 20): Promise<Proposal[]> {
    const query = `
      SELECT id, request_id, provider_id, price, message, status, created_at
      FROM proposals
      WHERE request_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;

    const result = await this.pool.query(query, [requestId, limit + 1]);
    return result.rows;
  }

  async getProposalById(id: string): Promise<Proposal | null> {
    const query = `
      SELECT id, request_id, provider_id, price, message, status, created_at
      FROM proposals
      WHERE id = $1
    `;

    const result = await this.pool.query(query, [id]);
    return result.rows[0] || null;
  }

  async acceptProposal(id: string): Promise<Proposal | null> {
    const query = `
      UPDATE proposals
      SET status = 'accepted'
      WHERE id = $1
      RETURNING id, request_id, provider_id, price, message, status, created_at
    `;

    const result = await this.pool.query(query, [id]);
    return result.rows[0] || null;
  }

  async rejectProposal(id: string, reason?: string): Promise<Proposal | null> {
    const query = `
      UPDATE proposals
      SET status = 'rejected', rejected_reason = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;

    const result = await this.pool.query(query, [reason || null, id]);
    return result.rows[0] || null;
  }

  async getProposalsByProvider(providerId: string): Promise<Proposal[]> {
    const query = `
      SELECT id, request_id, provider_id, price, message, status, created_at
      FROM proposals
      WHERE provider_id = $1
      ORDER BY created_at DESC
    `;

    const result = await this.pool.query(query, [providerId]);
    return result.rows;
  }

  async getProposalsPaginated(queryDto: ProposalQueryDto): Promise<Proposal[]> {
    const { request_id, provider_id, status, limit = 20, cursor } = queryDto;

    let query = `
      SELECT id, request_id, provider_id, price, message, status, created_at
      FROM proposals
      WHERE 1=1
    `;

    const values: any[] = [];
    let paramIndex = 1;

    if (request_id) {
      query += ` AND request_id = $${paramIndex++}`;
      values.push(request_id);
    }

    if (provider_id) {
      query += ` AND provider_id = $${paramIndex++}`;
      values.push(provider_id);
    }

    if (status) {
      query += ` AND status = $${paramIndex++}`;
      values.push(status);
    }

    if (cursor) {
      query += ` AND created_at < (SELECT created_at FROM proposals WHERE id = $${paramIndex++})`;
      values.push(cursor);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex++}`;
    values.push(limit + 1);

    const result = await this.pool.query(query, values);
    return result.rows;
  }

  async hasExistingProposal(requestId: string, providerId: string): Promise<boolean> {
    const query = `
      SELECT 1 FROM proposals
      WHERE request_id = $1 AND provider_id = $2
    `;

    const result = await this.pool.query(query, [requestId, providerId]);
    return result.rows.length > 0;
  }

  async getProposalsByCustomer(userId: string): Promise<Proposal[]> {
    const query = `
      SELECT p.id, p.request_id, p.provider_id, p.price, p.message, p.status, p.created_at
      FROM proposals p
      INNER JOIN service_requests sr ON p.request_id = sr.id
      WHERE sr.user_id = $1
      ORDER BY p.created_at DESC
    `;

    const result = await this.pool.query(query, [userId]);
    return result.rows;
  }

  async getProposalsByProviderUser(userId: string): Promise<Proposal[]> {
    const query = `
      SELECT p.id, p.request_id, p.provider_id, p.price, p.message, p.status, p.created_at
      FROM proposals p
      INNER JOIN providers prov ON p.provider_id = prov.id
      WHERE prov.user_id = $1
      ORDER BY p.created_at DESC
    `;

    const result = await this.pool.query(query, [userId]);
    return result.rows;
  }

  // ✅ NEW: Advanced query methods
  async getProposalsByDateRange(
    startDate: Date,
    endDate: Date,
    limit: number = 50
  ): Promise<Proposal[]> {
    const query = `
      SELECT * FROM proposals
      WHERE start_date BETWEEN $1 AND $2
      ORDER BY start_date ASC
      LIMIT $3
    `;
    const result = await this.pool.query(query, [startDate, endDate, limit]);
    return result.rows;
  }

  async getProposalsByEstimatedHours(
    minHours: number,
    maxHours: number,
    limit: number = 20
  ): Promise<Proposal[]> {
    const query = `
      SELECT * FROM proposals
      WHERE estimated_hours BETWEEN $1 AND $2
        AND status = 'pending'
      ORDER BY estimated_hours ASC
      LIMIT $3
    `;
    const result = await this.pool.query(query, [minHours, maxHours, limit]);
    return result.rows;
  }

  async getRejectedProposalsWithReasons(limit: number = 20): Promise<Proposal[]> {
    const query = `
      SELECT * FROM proposals
      WHERE status = 'rejected'
        AND rejected_reason IS NOT NULL
      ORDER BY updated_at DESC
      LIMIT $1
    `;
    const result = await this.pool.query(query, [limit]);
    return result.rows;
  }

  async getProposalResponseStats(): Promise<any> {
    const query = `
      SELECT 
        status,
        COUNT(*) as count,
        AVG(price) as avg_price
      FROM proposals
      GROUP BY status
    `;
    const result = await this.pool.query(query);
    return result.rows;
  }
}
