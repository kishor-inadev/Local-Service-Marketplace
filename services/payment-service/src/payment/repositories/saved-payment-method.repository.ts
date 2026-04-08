import { Injectable, Inject } from "@nestjs/common";
import { Pool } from "pg";
import { SavedPaymentMethod } from "../entities/saved-payment-method.entity";
import { SavePaymentMethodDto } from "../dto/save-payment-method.dto";

@Injectable()
export class SavedPaymentMethodRepository {
  constructor(@Inject("DATABASE_POOL") private readonly pool: Pool) {}

  async create(data: SavePaymentMethodDto): Promise<SavedPaymentMethod> {
    // If this is being set as default, unset all other defaults first
    if (data.is_default) {
      await this.pool.query(
        "UPDATE saved_payment_methods SET is_default = false WHERE user_id = $1",
        [data.user_id],
      );
    }

    const query = `
      INSERT INTO saved_payment_methods (
        user_id, payment_type, card_brand, last_four, expiry_month, expiry_year,
        is_default, billing_email, gateway_customer_id, gateway_payment_method_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const values = [
      data.user_id,
      data.payment_type,
      data.card_brand || null,
      data.last_four || null,
      data.expiry_month || null,
      data.expiry_year || null,
      data.is_default || false,
      data.billing_email || null,
      data.gateway_customer_id || null,
      data.gateway_payment_method_id || null,
    ];

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async findById(id: string): Promise<SavedPaymentMethod | null> {
    const query = `SELECT * FROM saved_payment_methods WHERE id = $1`;
    const result = await this.pool.query(query, [id]);
    return result.rows[0] || null;
  }

  async findByUserId(userId: string): Promise<SavedPaymentMethod[]> {
    const query = `
      SELECT * FROM saved_payment_methods
      WHERE user_id = $1
      ORDER BY is_default DESC, created_at DESC
    `;
    const result = await this.pool.query(query, [userId]);
    return result.rows;
  }

  async findDefaultByUserId(
    userId: string,
  ): Promise<SavedPaymentMethod | null> {
    const query = `
      SELECT * FROM saved_payment_methods
      WHERE user_id = $1 AND is_default = true
    `;
    const result = await this.pool.query(query, [userId]);
    return result.rows[0] || null;
  }

  async findExpiringWithinMonths(
    monthWindow = 1,
  ): Promise<SavedPaymentMethod[]> {
    const query = `
      SELECT *
      FROM saved_payment_methods
      WHERE expiry_month IS NOT NULL
        AND expiry_year IS NOT NULL
        AND (
          (expiry_year * 12 + expiry_month)
          BETWEEN
          ((EXTRACT(YEAR FROM CURRENT_DATE)::int) * 12 + EXTRACT(MONTH FROM CURRENT_DATE)::int)
          AND
          ((EXTRACT(YEAR FROM CURRENT_DATE)::int) * 12 + EXTRACT(MONTH FROM CURRENT_DATE)::int + $1)
        )
      ORDER BY user_id, expiry_year, expiry_month
    `;

    const result = await this.pool.query(query, [monthWindow]);
    return result.rows;
  }

  async setDefault(id: string, userId: string): Promise<SavedPaymentMethod> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      // Unset all defaults for this user
      await client.query(
        "UPDATE saved_payment_methods SET is_default = false WHERE user_id = $1",
        [userId],
      );

      // Set this one as default
      const result = await client.query(
        "UPDATE saved_payment_methods SET is_default = true WHERE id = $1 AND user_id = $2 RETURNING *",
        [id, userId],
      );

      await client.query("COMMIT");
      return result.rows[0];
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }

  async delete(id: string, userId: string): Promise<void> {
    const query = `DELETE FROM saved_payment_methods WHERE id = $1 AND user_id = $2`;
    await this.pool.query(query, [id, userId]);
  }
}
