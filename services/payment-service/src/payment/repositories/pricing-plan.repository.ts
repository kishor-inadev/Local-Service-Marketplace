import { Injectable, Inject } from "@nestjs/common";
import { Pool } from "pg";
import { PricingPlan } from "../entities/pricing-plan.entity";

@Injectable()
export class PricingPlanRepository {
  constructor(@Inject("DATABASE_POOL") private readonly pool: Pool) {}

  async create(data: {
    name: string;
    description?: string;
    price: number;
    billing_period: "monthly" | "yearly";
    features?: any;
    active?: boolean;
  }): Promise<PricingPlan> {
    const query = `
      INSERT INTO pricing_plans (
        name, description, price, billing_period, features, active
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const values = [
      data.name,
      data.description || null,
      data.price,
      data.billing_period,
      data.features ? JSON.stringify(data.features) : null,
      data.active !== undefined ? data.active : true,
    ];

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async findById(id: string): Promise<PricingPlan | null> {
    const query = `SELECT * FROM pricing_plans WHERE id = $1`;
    const result = await this.pool.query(query, [id]);
    return result.rows[0] || null;
  }

  async findAll(activeOnly: boolean = true): Promise<PricingPlan[]> {
    let query = `SELECT * FROM pricing_plans`;

    if (activeOnly) {
      query += ` WHERE active = true`;
    }

    query += ` ORDER BY price ASC`;

    const result = await this.pool.query(query);
    return result.rows;
  }

  async update(id: string, data: Partial<PricingPlan>): Promise<PricingPlan> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.keys(data).forEach((key) => {
      if (data[key] !== undefined && key !== "id" && key !== "created_at") {
        if (key === "features") {
          updates.push(`${key} = $${paramIndex++}`);
          values.push(JSON.stringify(data[key]));
        } else {
          updates.push(`${key} = $${paramIndex++}`);
          values.push(data[key]);
        }
      }
    });

    if (updates.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    const query = `
      UPDATE pricing_plans
      SET ${updates.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async deactivate(id: string): Promise<PricingPlan> {
    const query = `
      UPDATE pricing_plans
      SET active = false
      WHERE id = $1
      RETURNING *
    `;
    const result = await this.pool.query(query, [id]);
    return result.rows[0];
  }
}
