import { Injectable, Inject } from "@nestjs/common";
import { Pool } from "pg";
import { Refund } from "../entities/refund.entity";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class RefundRepository {
  constructor(@Inject("DATABASE_POOL") private pool: Pool) {}

  async createRefund(paymentId: string, amount: number): Promise<Refund> {
    const id = uuidv4();
    const query = `
      INSERT INTO refunds (id, payment_id, amount, status, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING *
    `;
    const values = [id, paymentId, amount, "pending"];
    const result = await this.pool.query(query, values);
    return new Refund({
      id: result.rows[0].id,
      display_id: result.rows[0].display_id,
      payment_id: result.rows[0].payment_id,
      amount: parseFloat(result.rows[0].amount),
      status: result.rows[0].status,
      created_at: result.rows[0].created_at,
    });
  }

  async getRefundById(id: string): Promise<Refund | null> {
    const query = "SELECT * FROM refunds WHERE id = $1";
    const result = await this.pool.query(query, [id]);
    if (result.rows.length === 0) {
      return null;
    }
    return new Refund({
      id: result.rows[0].id,
      display_id: result.rows[0].display_id,
      payment_id: result.rows[0].payment_id,
      amount: parseFloat(result.rows[0].amount),
      status: result.rows[0].status,
      created_at: result.rows[0].created_at,
    });
  }

  async updateRefundStatus(
    id: string,
    status: "pending" | "completed" | "failed",
  ): Promise<Refund> {
    const query = `
      UPDATE refunds 
      SET status = $1
      WHERE id = $2
      RETURNING *
    `;
    const result = await this.pool.query(query, [status, id]);
    return new Refund({
      id: result.rows[0].id,
      display_id: result.rows[0].display_id,
      payment_id: result.rows[0].payment_id,
      amount: parseFloat(result.rows[0].amount),
      status: result.rows[0].status,
      created_at: result.rows[0].created_at,
    });
  }

  async getRefundsByPaymentId(paymentId: string): Promise<Refund[]> {
    const query =
      "SELECT * FROM refunds WHERE payment_id = $1 ORDER BY created_at DESC";
    const result = await this.pool.query(query, [paymentId]);
    return result.rows.map(
      (row) =>
        new Refund({
          id: row.id,
          display_id: row.display_id,
          payment_id: row.payment_id,
          amount: parseFloat(row.amount),
          status: row.status,
          created_at: row.created_at,
        }),
    );
  }
}
