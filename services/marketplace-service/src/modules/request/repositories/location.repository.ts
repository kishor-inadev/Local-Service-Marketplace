import { Injectable, Inject } from "@nestjs/common";
import { Pool } from "pg";
import { Location } from "../entities/location.entity";

@Injectable()
export class LocationRepository {
  constructor(@Inject("DATABASE_POOL") private readonly pool: Pool) {}

  async createLocation(data: {
    user_id: string;
    latitude: number;
    longitude: number;
    address?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    country?: string;
  }): Promise<Location> {
    const query = `
      INSERT INTO locations (user_id, latitude, longitude, address, city, state, zip_code, country)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const values = [
      data.user_id,
      data.latitude,
      data.longitude,
      data.address || null,
      data.city || null,
      data.state || null,
      data.zip_code || null,
      data.country || "US",
    ];

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async getLocationById(id: string): Promise<Location | null> {
    const query = "SELECT * FROM locations WHERE id = $1";
    const result = await this.pool.query(query, [id]);
    return result.rows[0] || null;
  }

  async getLocationsByUserId(userId: string): Promise<Location[]> {
    const query =
      "SELECT * FROM locations WHERE user_id = $1 ORDER BY created_at DESC";
    const result = await this.pool.query(query, [userId]);
    return result.rows;
  }

  async updateLocation(
    id: string,
    data: Partial<Location>,
  ): Promise<Location | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.latitude !== undefined) {
      fields.push(`latitude = $${paramIndex++}`);
      values.push(data.latitude);
    }
    if (data.longitude !== undefined) {
      fields.push(`longitude = $${paramIndex++}`);
      values.push(data.longitude);
    }
    if (data.address !== undefined) {
      fields.push(`address = $${paramIndex++}`);
      values.push(data.address);
    }
    if (data.city !== undefined) {
      fields.push(`city = $${paramIndex++}`);
      values.push(data.city);
    }
    if (data.state !== undefined) {
      fields.push(`state = $${paramIndex++}`);
      values.push(data.state);
    }
    if (data.zip_code !== undefined) {
      fields.push(`zip_code = $${paramIndex++}`);
      values.push(data.zip_code);
    }
    if (data.country !== undefined) {
      fields.push(`country = $${paramIndex++}`);
      values.push(data.country);
    }

    if (fields.length === 0) {
      return this.getLocationById(id);
    }

    values.push(id);
    const query = `
      UPDATE locations
      SET ${fields.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  async deleteLocation(id: string): Promise<boolean> {
    const query = "DELETE FROM locations WHERE id = $1";
    const result = await this.pool.query(query, [id]);
    return result.rowCount > 0;
  }
}
