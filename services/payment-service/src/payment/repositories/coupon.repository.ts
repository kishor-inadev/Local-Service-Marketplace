import { Injectable, Inject } from "@nestjs/common";
import { Pool } from "pg";
import { Coupon } from "../entities/coupon.entity";
import { CouponUsage } from "../entities/coupon-usage.entity";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class CouponRepository {
  constructor(@Inject("DATABASE_POOL") private pool: Pool) {}

  async getCouponByCode(code: string): Promise<Coupon | null> {
    const query = "SELECT * FROM coupons WHERE code = $1";
    const result = await this.pool.query(query, [code]);
    if (result.rows.length === 0) {
      return null;
    }
    return new Coupon({
      id: result.rows[0].id,
      display_id: result.rows[0].display_id,
      code: result.rows[0].code,
      discount_percent: parseFloat(result.rows[0].discount_percent),
      max_uses: result.rows[0].max_uses,
      max_uses_per_user: result.rows[0].max_uses_per_user,
      min_purchase_amount: result.rows[0].min_purchase_amount,
      active: result.rows[0].active,
      created_by: result.rows[0].created_by,
      expires_at: result.rows[0].expires_at,
      created_at: result.rows[0].created_at,
    });
  }

  async isCouponUsedByUser(couponId: string, userId: string): Promise<boolean> {
    const query =
      "SELECT COUNT(*) FROM coupon_usage WHERE coupon_id = $1 AND user_id = $2";
    const result = await this.pool.query(query, [couponId, userId]);
    return parseInt(result.rows[0].count) > 0;
  }

  async deleteExpired(): Promise<number> {
    const result = await this.pool.query(
      'DELETE FROM coupons WHERE expires_at IS NOT NULL AND expires_at < NOW()',
    );
    return result.rowCount ?? 0;
  }

  async recordCouponUsage(
    couponId: string,
    userId: string,
  ): Promise<CouponUsage | null> {
    const id = uuidv4();
    const query = `
      INSERT INTO coupon_usage (id, coupon_id, user_id, used_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (coupon_id, user_id) DO NOTHING
      RETURNING *
    `;
    const values = [id, couponId, userId];
    const result = await this.pool.query(query, values);
    // ON CONFLICT DO NOTHING returns 0 rows when a conflict occurs — guard against that
    if (!result.rows.length) {
      return null;
    }
    return new CouponUsage({
      id: result.rows[0].id,
      coupon_id: result.rows[0].coupon_id,
      user_id: result.rows[0].user_id,
      used_at: result.rows[0].used_at,
    });
  }

  async getCouponUsagesByUser(userId: string): Promise<CouponUsage[]> {
    const query =
      "SELECT * FROM coupon_usage WHERE user_id = $1 ORDER BY used_at DESC";
    const result = await this.pool.query(query, [userId]);
    return result.rows.map(
      (row) =>
        new CouponUsage({
          id: row.id,
          coupon_id: row.coupon_id,
          user_id: row.user_id,
          used_at: row.used_at,
        }),
    );
  }

  // ✅ NEW: Advanced query methods for new coupon fields
  async getActiveCoupons(): Promise<Coupon[]> {
    const query = `
      SELECT * FROM coupons
      WHERE active = true
        AND expires_at > NOW()
        AND (max_uses IS NULL OR max_uses > (SELECT COUNT(*) FROM coupon_usage WHERE coupon_id = coupons.id))
      ORDER BY expires_at ASC
    `;
    const result = await this.pool.query(query);
    return result.rows.map((row) => new Coupon(row));
  }

  async createCoupon(data: {
    code: string;
    discount_percent: number;
    max_uses?: number;
    max_uses_per_user?: number;
    min_purchase_amount?: number;
    active?: boolean;
    expires_at: Date;
    created_by?: string;
  }): Promise<Coupon> {
    const id = uuidv4();
    const query = `
      INSERT INTO coupons (
        id, code, discount_percent, max_uses, max_uses_per_user,
        min_purchase_amount, active, expires_at, created_by, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      RETURNING *
    `;
    const values = [
      id,
      data.code,
      data.discount_percent,
      data.max_uses || null,
      data.max_uses_per_user || 1,
      data.min_purchase_amount || null,
      data.active !== undefined ? data.active : true,
      data.expires_at,
      data.created_by || null,
    ];
    const result = await this.pool.query(query, values);
    return new Coupon(result.rows[0]);
  }

  async getCouponUsageCount(
    couponId: string,
    userId?: string,
  ): Promise<number> {
    let query =
      "SELECT COUNT(*) as count FROM coupon_usage WHERE coupon_id = $1";
    const values: any[] = [couponId];

    if (userId) {
      query += " AND user_id = $2";
      values.push(userId);
    }

    const result = await this.pool.query(query, values);
    return parseInt(result.rows[0].count, 10);
  }

  async deactivateCoupon(couponId: string): Promise<Coupon> {
    const query = `
      UPDATE coupons 
      SET active = false
      WHERE id = $1
      RETURNING *
    `;
    const result = await this.pool.query(query, [couponId]);
    return new Coupon(result.rows[0]);
  }

  async getCouponsByCreator(createdBy: string): Promise<Coupon[]> {
    const query = `
      SELECT * FROM coupons
      WHERE created_by = $1
      ORDER BY created_at DESC
    `;
    const result = await this.pool.query(query, [createdBy]);
    return result.rows.map((row) => new Coupon(row));
  }

  async getCouponStats(couponId: string): Promise<any> {
    const query = `
      SELECT 
        c.*,
        (SELECT COUNT(*) FROM coupon_usage WHERE coupon_id = c.id) as total_uses,
        (SELECT COUNT(DISTINCT user_id) FROM coupon_usage WHERE coupon_id = c.id) as unique_users
      FROM coupons c
      WHERE c.id = $1
    `;
    const result = await this.pool.query(query, [couponId]);
    return result.rows[0];
  }
}
