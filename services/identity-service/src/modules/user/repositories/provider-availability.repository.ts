import { Injectable, Inject } from "@nestjs/common";
import { Pool } from "pg";
import { DATABASE_POOL } from "@/common/database/database.module";
import { ProviderAvailability } from "../entities/provider-availability.entity";

@Injectable()
export class ProviderAvailabilityRepository {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) { }

  async create(
    providerId: string,
    dayOfWeek: number,
    startTime: string,
    endTime: string,
  ): Promise<ProviderAvailability> {
    const query = `
      INSERT INTO provider_availability (provider_id, day_of_week, start_time, end_time)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const result = await this.pool.query(query, [
      providerId,
      dayOfWeek,
      startTime,
      endTime,
    ]);
    return result.rows[0];
  }

  async findByProviderId(providerId: string): Promise<ProviderAvailability[]> {
    const query =
      "SELECT * FROM provider_availability WHERE provider_id = $1 ORDER BY day_of_week, start_time";
    const result = await this.pool.query(query, [providerId]);
    return result.rows;
  }

  async deleteByProviderId(providerId: string): Promise<void> {
    const query = "DELETE FROM provider_availability WHERE provider_id = $1";
    await this.pool.query(query, [providerId]);
  }

  async replaceAvailability(
    providerId: string,
    slots: Array<{ day_of_week: number; start_time: string; end_time: string }>,
  ): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      // Delete existing availability
      await client.query(
        "DELETE FROM provider_availability WHERE provider_id = $1",
        [providerId],
      );

      // Insert new availability
      if (slots.length > 0) {
        for (const slot of slots) {
          await client.query(
            "INSERT INTO provider_availability (provider_id, day_of_week, start_time, end_time) VALUES ($1, $2, $3, $4)",
            [providerId, slot.day_of_week, slot.start_time, slot.end_time],
          );
        }
      }

      await client.query("COMMIT");
    } catch (error: any) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}
