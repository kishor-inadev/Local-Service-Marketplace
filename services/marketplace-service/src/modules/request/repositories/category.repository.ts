import { Injectable, Inject } from "@nestjs/common";
import { Pool } from "pg";
import { ServiceCategory } from "../entities/service-category.entity";
import { UpdateCategoryDto } from "../dto/update-category.dto";

@Injectable()
export class CategoryRepository {
  constructor(@Inject("DATABASE_POOL") private readonly pool: Pool) {}

  async getAllCategories(): Promise<ServiceCategory[]> {
    const query = `
      SELECT id, display_id, name, description, icon, active, created_at
      FROM service_categories
      ORDER BY name ASC
    `;

    const result = await this.pool.query(query);
    return result.rows;
  }

  async getCategoryById(id: string): Promise<ServiceCategory | null> {
    const query = `
      SELECT id, display_id, name, description, icon, active, created_at
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
      RETURNING id, display_id, name, description, icon, active, created_at
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
      SELECT id, display_id, name, description, icon, active, created_at
      FROM service_categories
      WHERE name ILIKE $1
      ORDER BY name ASC
      LIMIT $2
    `;

    const result = await this.pool.query(query, [`%${searchTerm}%`, limit]);
    return result.rows;
  }

  async updateCategory(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<ServiceCategory> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updateCategoryDto.name !== undefined) {
      fields.push(`name = $${paramIndex++}`);
      values.push(updateCategoryDto.name);
    }

    if (updateCategoryDto.description !== undefined) {
      fields.push(`description = $${paramIndex++}`);
      values.push(updateCategoryDto.description);
    }

    if (updateCategoryDto.icon !== undefined) {
      fields.push(`icon = $${paramIndex++}`);
      values.push(updateCategoryDto.icon);
    }

    if (updateCategoryDto.active !== undefined) {
      fields.push(`active = $${paramIndex++}`);
      values.push(updateCategoryDto.active);
    }

    if (fields.length === 0) {
      // No fields to update, just return the current category
      return this.getCategoryById(id);
    }

    values.push(id);

    const query = `
      UPDATE service_categories
      SET ${fields.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING id, display_id, name, description, icon, active, created_at
    `;

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async softDeleteCategory(id: string): Promise<void> {
    const query = `
      UPDATE service_categories
      SET active = false
      WHERE id = $1
    `;

    await this.pool.query(query, [id]);
  }
}
