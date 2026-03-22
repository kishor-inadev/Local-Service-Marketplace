import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { DATABASE_POOL } from '@/common/database/database.module';
import { Location } from '../entities/location.entity';

@Injectable()
export class LocationRepository {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async create(
    city: string,
    state: string,
    country: string,
    latitude?: number,
    longitude?: number,
  ): Promise<Location> {
    const query = `
      INSERT INTO locations (city, state, country, latitude, longitude)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const result = await this.pool.query(query, [city, state, country, latitude, longitude]);
    return result.rows[0];
  }

  async findById(id: string): Promise<Location | null> {
    const query = 'SELECT * FROM locations WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    return result.rows[0] || null;
  }

  async findByCity(city: string, state: string, country: string): Promise<Location | null> {
    const query = 'SELECT * FROM locations WHERE city = $1 AND state = $2 AND country = $3';
    const result = await this.pool.query(query, [city, state, country]);
    return result.rows[0] || null;
  }

  async findAll(): Promise<Location[]> {
    const query = 'SELECT * FROM locations ORDER BY country, state, city';
    const result = await this.pool.query(query);
    return result.rows;
  }
}
