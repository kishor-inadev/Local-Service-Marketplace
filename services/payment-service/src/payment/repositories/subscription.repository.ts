import { Injectable, Inject } from "@nestjs/common";
import { Pool } from "pg";
import { Subscription } from "../entities/subscription.entity";
import {
  SubscriptionQueryDto,
  SubscriptionSortBy,
  SortOrder,
} from "../dto/transaction-query.dto";

@Injectable()
export class SubscriptionRepository {
  constructor(@Inject("DATABASE_POOL") private readonly pool: Pool) {}

  async create(data: {
    provider_id: string;
    plan_id: string;
    status?: "active" | "cancelled" | "expired" | "pending";
    started_at?: Date;
    expires_at?: Date;
  }): Promise<Subscription> {
    const query = `
      INSERT INTO subscriptions (
        provider_id, plan_id, status, started_at, expires_at
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const values = [
      data.provider_id,
      data.plan_id,
      data.status || "pending",
      data.started_at || new Date(),
      data.expires_at || null,
    ];

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async findById(id: string): Promise<Subscription | null> {
    const query = `SELECT * FROM subscriptions WHERE id = $1`;
    const result = await this.pool.query(query, [id]);
    return result.rows[0] || null;
  }

  async findByProvider(providerId: string): Promise<Subscription[]> {
    const query = `
      SELECT s.*, p.name as plan_name, p.price, p.billing_period
      FROM subscriptions s
      JOIN pricing_plans p ON s.plan_id = p.id
      WHERE s.provider_id = $1
      ORDER BY s.created_at DESC
    `;
    const result = await this.pool.query(query, [providerId]);
    return result.rows;
  }

  async findByProviderPaginated(
    providerId: string,
    queryDto: SubscriptionQueryDto,
  ): Promise<Subscription[]> {
    const {
      limit = 20,
      page,
      cursor,
      status,
      sortBy = SubscriptionSortBy.CREATED_AT,
      sortOrder = SortOrder.DESC,
    } = queryDto;

    let query = `
      SELECT s.*, p.name as plan_name, p.price, p.billing_period
      FROM subscriptions s
      JOIN pricing_plans p ON s.plan_id = p.id
      WHERE s.provider_id = $1
    `;
    const values: any[] = [providerId];
    let paramIndex = 2;
    const usingOffset = page !== undefined && page > 0;

    if (status) {
      query += ` AND s.status = $${paramIndex++}`;
      values.push(status);
    }

    if (cursor && !usingOffset) {
      query += ` AND s.created_at < $${paramIndex++}`;
      values.push(cursor);
    }

    const sortMap: Record<SubscriptionSortBy, string> = {
      [SubscriptionSortBy.CREATED_AT]: "s.created_at",
      [SubscriptionSortBy.EXPIRES_AT]: "s.expires_at",
    };

    query += ` ORDER BY ${sortMap[sortBy] || "s.created_at"} ${sortOrder === SortOrder.ASC ? "ASC" : "DESC"}, s.id DESC`;

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

  async countByProvider(
    providerId: string,
    queryDto: SubscriptionQueryDto,
  ): Promise<number> {
    const { status } = queryDto;
    let query = `SELECT COUNT(*)::int AS total FROM subscriptions s WHERE s.provider_id = $1`;
    const values: any[] = [providerId];
    let paramIndex = 2;
    if (status) {
      query += ` AND s.status = $${paramIndex++}`;
      values.push(status);
    }
    const result = await this.pool.query(query, values);
    return result.rows[0].total;
  }

  async findActiveByProvider(providerId: string): Promise<Subscription | null> {
    const query = `
      SELECT s.*, p.name as plan_name, p.price, p.billing_period
      FROM subscriptions s
      JOIN pricing_plans p ON s.plan_id = p.id
      WHERE s.provider_id = $1 AND s.status = 'active'
      ORDER BY s.created_at DESC
      LIMIT 1
    `;
    const result = await this.pool.query(query, [providerId]);
    return result.rows[0] || null;
  }

  async updateStatus(
    id: string,
    status: "active" | "cancelled" | "expired" | "pending",
  ): Promise<Subscription> {
    const query = `
      UPDATE subscriptions
      SET status = $1,
          cancelled_at = CASE WHEN $1 = 'cancelled' THEN NOW() ELSE cancelled_at END
      WHERE id = $2
      RETURNING *
    `;
    const result = await this.pool.query(query, [status, id]);
    return result.rows[0];
  }

  async cancel(id: string): Promise<Subscription> {
    const query = `
      UPDATE subscriptions
      SET status = 'cancelled',
          cancelled_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    const result = await this.pool.query(query, [id]);
    return result.rows[0];
  }

  async getExpiringSubscriptions(days: number = 7): Promise<Subscription[]> {
    const query = `
      SELECT s.*, p.business_name, p.user_id, pl.name as plan_name
      FROM subscriptions s
      JOIN providers p ON s.provider_id = p.id
      JOIN pricing_plans pl ON s.plan_id = pl.id
      WHERE s.status = 'active'
        AND s.expires_at IS NOT NULL
        AND s.expires_at > NOW()
        AND s.expires_at <= NOW() + INTERVAL '1 day' * $1
      ORDER BY s.expires_at ASC
    `;
    const result = await this.pool.query(query, [days]);
    return result.rows;
  }

  async getExpiringSubscriptionsPaginated(
    days: number,
    queryDto: SubscriptionQueryDto,
  ): Promise<Subscription[]> {
    const {
      limit = 20,
      page,
      status,
      sortBy = SubscriptionSortBy.EXPIRES_AT,
      sortOrder = SortOrder.ASC,
    } = queryDto;
    let query = `
      SELECT s.*, p.business_name, p.user_id, pl.name as plan_name
      FROM subscriptions s
      JOIN providers p ON s.provider_id = p.id
      JOIN pricing_plans pl ON s.plan_id = pl.id
      WHERE s.expires_at IS NOT NULL
        AND s.expires_at > NOW()
        AND s.expires_at <= NOW() + INTERVAL '1 day' * $1
    `;
    const values: any[] = [days];
    let paramIndex = 2;

    if (status) {
      query += ` AND s.status = $${paramIndex++}`;
      values.push(status);
    }

    const sortMap: Record<SubscriptionSortBy, string> = {
      [SubscriptionSortBy.CREATED_AT]: "s.created_at",
      [SubscriptionSortBy.EXPIRES_AT]: "s.expires_at",
    };

    query += ` ORDER BY ${sortMap[sortBy] || "s.expires_at"} ${sortOrder === SortOrder.ASC ? "ASC" : "DESC"}, s.id DESC`;
    const offset = ((page || 1) - 1) * limit;
    query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    values.push(limit, offset);

    const result = await this.pool.query(query, values);
    return result.rows;
  }

  async countExpiringSubscriptions(
    days: number,
    queryDto: SubscriptionQueryDto,
  ): Promise<number> {
    const { status } = queryDto;
    let query = `
      SELECT COUNT(*)::int AS total
      FROM subscriptions s
      WHERE s.expires_at IS NOT NULL
        AND s.expires_at > NOW()
        AND s.expires_at <= NOW() + INTERVAL '1 day' * $1
    `;
    const values: any[] = [days];
    let paramIndex = 2;
    if (status) {
      query += ` AND s.status = $${paramIndex++}`;
      values.push(status);
    }
    const result = await this.pool.query(query, values);
    return result.rows[0].total;
  }

  async expireOldSubscriptions(): Promise<number> {
    const query = `
      UPDATE subscriptions
      SET status = 'expired'
      WHERE status = 'active'
        AND expires_at IS NOT NULL
        AND expires_at < NOW()
    `;
    const result = await this.pool.query(query);
    return result.rowCount || 0;
  }

  /** Returns active subscriptions expiring within the next `hoursAhead` hours, with plan pricing info. */
  async getSubscriptionsForRenewal(hoursAhead: number = 24): Promise<any[]> {
    const query = `
      SELECT s.id, s.provider_id, s.plan_id, s.expires_at,
             pl.price, pl.billing_period
      FROM subscriptions s
      JOIN pricing_plans pl ON s.plan_id = pl.id
      WHERE s.status = 'active'
        AND s.expires_at IS NOT NULL
        AND s.expires_at > NOW()
        AND s.expires_at <= NOW() + INTERVAL '1 hour' * $1
      ORDER BY s.expires_at ASC
    `;
    const result = await this.pool.query(query, [hoursAhead]);
    return result.rows;
  }

  /** Extends a subscription's expires_at after a successful renewal charge. */
  async renewSubscription(id: string, newExpiresAt: Date): Promise<void> {
    const query = `
      UPDATE subscriptions
      SET expires_at = $1, status = 'active'
      WHERE id = $2
    `;
    await this.pool.query(query, [newExpiresAt, id]);
  }
}
