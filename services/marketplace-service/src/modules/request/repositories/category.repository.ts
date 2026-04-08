import { Injectable, Inject } from "@nestjs/common";
import { Pool } from "pg";
import { ServiceCategory } from "../entities/service-category.entity";

@Injectable()
export class CategoryRepository {
  constructor(@Inject("DATABASE_POOL") private readonly pool: Pool) {}

  async getAllCategories(): Promise<ServiceCategory[]> {
    const query = `
      SELECT id, name, created_at
      FROM service_categories
      ORDER BY name ASC
    `;

    const result = await this.pool.query(query);
    return result.rows;
  }

  async getCategoryById(id: string): Promise<ServiceCategory | null> {
    const query = `
      SELECT id, name, created_at
      FROM service_categories
      WHERE id = $1
    `;

    const result = await this.pool.query(query, [id]);
    return result.rows[0] || null;
  }

  async createCategory(name: string): Promise<ServiceCategory> {
    const query = `
      INSERT INTO service_categories (name)
      VALUES ($1)
      RETURNING id, name, created_at
    `;

    const result = await this.pool.query(query, [name]);
    return result.rows[0];
  }

  async categoryExists(id: string): Promise<boolean> {
    const query = `SELECT 1 FROM service_categories WHERE id = $1`;
    const result = await this.pool.query(query, [id]);
    return result.rows.length > 0;
  }

  async searchCategories(
    searchTerm: string,
    limit: number = 10,
  ): Promise<ServiceCategory[]> {
    const query = `
      SELECT id, name, created_at
      FROM service_categories
      WHERE name ILIKE $1
      ORDER BY name ASC
      LIMIT $2
    `;

    const result = await this.pool.query(query, [`%${searchTerm}%`, limit]);
    return result.rows;
  }
}
