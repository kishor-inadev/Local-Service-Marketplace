import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { DATABASE_POOL } from '@/common/database/database.module';
import { ProviderPortfolio } from '../entities/provider-portfolio.entity';
import { CreatePortfolioDto } from '../dto/create-portfolio.dto';

@Injectable()
export class ProviderPortfolioRepository {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async create(data: CreatePortfolioDto): Promise<ProviderPortfolio> {
    const query = `
      INSERT INTO provider_portfolio (
        provider_id, title, description, image_url, display_order
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const values = [
      data.provider_id,
      data.title,
      data.description || null,
      data.image_url,
      data.display_order || 0
    ];

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async findById(id: string): Promise<ProviderPortfolio | null> {
    const query = `SELECT * FROM provider_portfolio WHERE id = $1`;
    const result = await this.pool.query(query, [id]);
    return result.rows[0] || null;
  }

  async findByProvider(providerId: string): Promise<ProviderPortfolio[]> {
    const query = `
      SELECT * FROM provider_portfolio
      WHERE provider_id = $1
      ORDER BY display_order ASC, created_at DESC
    `;
    const result = await this.pool.query(query, [providerId]);
    return result.rows;
  }

  async update(id: string, data: Partial<CreatePortfolioDto>): Promise<ProviderPortfolio> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.title) {
      updates.push(`title = $${paramIndex++}`);
      values.push(data.title);
    }

    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(data.description);
    }

    if (data.image_url) {
      updates.push(`image_url = $${paramIndex++}`);
      values.push(data.image_url);
    }

    if (data.display_order !== undefined) {
      updates.push(`display_order = $${paramIndex++}`);
      values.push(data.display_order);
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    const query = `
      UPDATE provider_portfolio
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async delete(id: string): Promise<void> {
    const query = `DELETE FROM provider_portfolio WHERE id = $1`;
    await this.pool.query(query, [id]);
  }

  async reorderPortfolio(providerId: string, itemOrders: Array<{id: string, order: number}>): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      for (const item of itemOrders) {
        await client.query(
          'UPDATE provider_portfolio SET display_order = $1 WHERE id = $2 AND provider_id = $3',
          [item.order, item.id, providerId]
        );
      }

      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
}
