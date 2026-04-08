import { Injectable, Inject } from "@nestjs/common";
import { Pool } from "pg";
import { Proposal } from "../entities/proposal.entity";
import { CreateProposalDto } from "../dto/create-proposal.dto";
import {
  ProposalQueryDto,
  ProposalSortBy,
  SortOrder,
} from "../dto/proposal-query.dto";
import { resolveId } from "@/common/utils/resolve-id.util";

@Injectable()
export class ProposalRepository {
  constructor(@Inject("DATABASE_POOL") private readonly pool: Pool) {}

  async createProposal(dto: CreateProposalDto): Promise<Proposal> {
    const requestId = await resolveId(
      this.pool,
      "service_requests",
      dto.request_id,
    );
    const providerId = await resolveId(this.pool, "providers", dto.provider_id);
    const query = `
      INSERT INTO proposals (
        request_id, provider_id, price, message, 
        estimated_hours, start_date, completion_date, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
      RETURNING *
    `;

    const values = [
      requestId,
      providerId,
      dto.price,
      dto.message,
      dto.estimated_hours || null, // ✅ NEW
      dto.start_date || null, // ✅ NEW
      dto.completion_date || null, // ✅ NEW
    ];

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async getProposalsForRequest(
    requestId: string,
    limit = 20,
  ): Promise<Proposal[]> {
    requestId = await resolveId(this.pool, "service_requests", requestId);
    const query = `
      SELECT id, display_id, request_id, provider_id, price, message, status, created_at
      FROM proposals
      WHERE request_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;

    const result = await this.pool.query(query, [requestId, limit + 1]);
    return result.rows;
  }

  async getProposalById(id: string): Promise<Proposal | null> {
    id = await resolveId(this.pool, "proposals", id);
    const query = `
      SELECT p.id, p.display_id, p.request_id, p.provider_id, p.price, p.message, p.status, p.created_at,
             sr.user_id AS customer_id
      FROM proposals p
      JOIN service_requests sr ON sr.id = p.request_id
      WHERE p.id = $1
    `;

    const result = await this.pool.query(query, [id]);
    return result.rows[0] || null;
  }

  async acceptProposal(id: string): Promise<Proposal | null> {
    const query = `
      UPDATE proposals
      SET status = 'accepted'
      WHERE id = $1
      RETURNING id, display_id, request_id, provider_id, price, message, status, created_at
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

  async withdrawProposal(
    id: string,
    providerId: string,
  ): Promise<Proposal | null> {
    const query = `
      UPDATE proposals
      SET status = 'withdrawn', updated_at = NOW()
      WHERE id = $1 AND provider_id = $2
      RETURNING *
    `;

    const result = await this.pool.query(query, [id, providerId]);
    return result.rows[0] || null;
  }

  async updateProposal(
    id: string,
    providerId: string,
    fields: { price?: number; message?: string; estimated_hours?: number },
  ): Promise<Proposal | null> {
    const setClauses: string[] = ["updated_at = NOW()"];
    const values: any[] = [];
    let idx = 1;

    if (fields.price !== undefined) {
      setClauses.push(`price = $${idx++}`);
      values.push(fields.price);
    }
    if (fields.message !== undefined) {
      setClauses.push(`message = $${idx++}`);
      values.push(fields.message);
    }
    if (fields.estimated_hours !== undefined) {
      setClauses.push(`estimated_hours = $${idx++}`);
      values.push(fields.estimated_hours);
    }

    if (values.length === 0) return this.getProposalById(id);

    values.push(id, providerId);
    const query = `
      UPDATE proposals
      SET ${setClauses.join(", ")}
      WHERE id = $${idx++} AND provider_id = $${idx++} AND status = 'pending'
      RETURNING *
    `;

    const result = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  async getProposalsByProvider(providerId: string): Promise<Proposal[]> {
    providerId = await resolveId(this.pool, "providers", providerId);
    const query = `
      SELECT id, display_id, request_id, provider_id, price, message, status, created_at
      FROM proposals
      WHERE provider_id = $1
      ORDER BY created_at DESC
      LIMIT 200
    `;

    const result = await this.pool.query(query, [providerId]);
    return result.rows;
  }

  async getProposalsPaginated(queryDto: ProposalQueryDto): Promise<Proposal[]> {
    let {
      request_id,
      provider_id,
      status,
      limit = 20,
      cursor,
      page,
      min_price,
      max_price,
      created_from,
      created_to,
      sortBy = ProposalSortBy.CREATED_AT,
      sortOrder = SortOrder.DESC,
    } = queryDto;

    [request_id, provider_id] = await Promise.all([
      request_id
        ? resolveId(this.pool, "service_requests", request_id)
        : Promise.resolve(undefined),
      provider_id
        ? resolveId(this.pool, "providers", provider_id)
        : Promise.resolve(undefined),
    ]);

    let query = `
      SELECT id, display_id, request_id, provider_id, price, message, status, created_at
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

    const usingOffset = page !== undefined && page > 0;

    if (cursor && !usingOffset) {
      query += ` AND created_at < (SELECT created_at FROM proposals WHERE id = $${paramIndex++})`;
      values.push(cursor);
    }

    if (min_price !== undefined) {
      query += ` AND price >= $${paramIndex++}`;
      values.push(min_price);
    }

    if (max_price !== undefined) {
      query += ` AND price <= $${paramIndex++}`;
      values.push(max_price);
    }

    if (created_from) {
      query += ` AND created_at >= $${paramIndex++}`;
      values.push(created_from);
    }

    if (created_to) {
      query += ` AND created_at <= $${paramIndex++}`;
      values.push(created_to);
    }

    const sortMap: Record<ProposalSortBy, string> = {
      [ProposalSortBy.CREATED_AT]: "created_at",
      [ProposalSortBy.PRICE]: "price",
      [ProposalSortBy.START_DATE]: "start_date",
    };
    const safeSortColumn = sortMap[sortBy] || "created_at";
    const safeSortOrder = sortOrder === SortOrder.ASC ? "ASC" : "DESC";

    query += ` ORDER BY ${safeSortColumn} ${safeSortOrder}, id DESC`;

    if (usingOffset) {
      const offset = ((page || 1) - 1) * limit;
      query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
      values.push(limit, offset);
    } else {
      query += ` LIMIT $${paramIndex++}`;
      values.push(limit + 1);
    }

    const result = await this.pool.query(query, values);
    return result.rows;
  }

  async countProposals(queryDto: ProposalQueryDto): Promise<number> {
    let {
      request_id,
      provider_id,
      status,
      min_price,
      max_price,
      created_from,
      created_to,
    } = queryDto;

    [request_id, provider_id] = await Promise.all([
      request_id
        ? resolveId(this.pool, "service_requests", request_id)
        : Promise.resolve(undefined),
      provider_id
        ? resolveId(this.pool, "providers", provider_id)
        : Promise.resolve(undefined),
    ]);

    let query = `
      SELECT COUNT(*)::int AS total
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

    if (min_price !== undefined) {
      query += ` AND price >= $${paramIndex++}`;
      values.push(min_price);
    }

    if (max_price !== undefined) {
      query += ` AND price <= $${paramIndex++}`;
      values.push(max_price);
    }

    if (created_from) {
      query += ` AND created_at >= $${paramIndex++}`;
      values.push(created_from);
    }

    if (created_to) {
      query += ` AND created_at <= $${paramIndex++}`;
      values.push(created_to);
    }

    const result = await this.pool.query(query, values);
    return result.rows[0].total;
  }

  async hasExistingProposal(
    requestId: string,
    providerId: string,
  ): Promise<boolean> {
    [requestId, providerId] = await Promise.all([
      resolveId(this.pool, "service_requests", requestId),
      resolveId(this.pool, "providers", providerId),
    ]);
    const query = `
      SELECT 1 FROM proposals
      WHERE request_id = $1 AND provider_id = $2
    `;

    const result = await this.pool.query(query, [requestId, providerId]);
    return result.rows.length > 0;
  }

  async getProposalsByCustomer(userId: string): Promise<Proposal[]> {
    const query = `
      SELECT p.id, p.display_id, p.request_id, p.provider_id, p.price, p.message, p.status, p.created_at
      FROM proposals p
      INNER JOIN service_requests sr ON p.request_id = sr.id
      WHERE sr.user_id = $1
      ORDER BY p.created_at DESC
      LIMIT 200
    `;

    const result = await this.pool.query(query, [userId]);
    return result.rows;
  }

  async getProposalsByProviderUser(userId: string): Promise<Proposal[]> {
    // NOTE: providers table is owned by identity-service. In a fully separated DB
    // setup, this should call the identity-service API to resolve provider_id first.
    const query = `
      SELECT p.id, p.display_id, p.request_id, p.provider_id, p.price, p.message, p.status, p.created_at
      FROM proposals p
      INNER JOIN providers prov ON p.provider_id = prov.id
      WHERE prov.user_id = $1
      ORDER BY p.created_at DESC
      LIMIT 200
    `;

    const result = await this.pool.query(query, [userId]);
    return result.rows;
  }

  // ✅ NEW: Advanced query methods
  async getProposalsByDateRange(
    startDate: Date,
    endDate: Date,
    limit: number = 50,
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
    limit: number = 20,
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

  async getRejectedProposalsWithReasons(
    limit: number = 20,
  ): Promise<Proposal[]> {
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
