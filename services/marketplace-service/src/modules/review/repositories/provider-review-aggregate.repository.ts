import { Injectable, Inject } from "@nestjs/common";
import { Pool } from "pg";
import { ProviderReviewAggregate } from "../entities/provider-review-aggregate.entity";

@Injectable()
export class ProviderReviewAggregateRepository {
  constructor(@Inject("DATABASE_POOL") private readonly pool: Pool) {}

  async upsert(providerId: string): Promise<ProviderReviewAggregate> {
    const query = `
      INSERT INTO provider_review_aggregates (
        provider_id, total_reviews, average_rating,
        rating_1_count, rating_2_count, rating_3_count, rating_4_count, rating_5_count,
        last_review_at, updated_at
      )
      SELECT
        provider_id,
        COUNT(*) as total_reviews,
        ROUND(AVG(rating)::numeric, 2) as average_rating,
        COUNT(*) FILTER (WHERE rating = 1) as rating_1_count,
        COUNT(*) FILTER (WHERE rating = 2) as rating_2_count,
        COUNT(*) FILTER (WHERE rating = 3) as rating_3_count,
        COUNT(*) FILTER (WHERE rating = 4) as rating_4_count,
        COUNT(*) FILTER (WHERE rating = 5) as rating_5_count,
        MAX(created_at) as last_review_at,
        NOW() as updated_at
      FROM reviews
      WHERE provider_id = $1
      GROUP BY provider_id
      ON CONFLICT (provider_id)
      DO UPDATE SET
        total_reviews = EXCLUDED.total_reviews,
        average_rating = EXCLUDED.average_rating,
        rating_1_count = EXCLUDED.rating_1_count,
        rating_2_count = EXCLUDED.rating_2_count,
        rating_3_count = EXCLUDED.rating_3_count,
        rating_4_count = EXCLUDED.rating_4_count,
        rating_5_count = EXCLUDED.rating_5_count,
        last_review_at = EXCLUDED.last_review_at,
        updated_at = NOW()
      RETURNING *
    `;

    const result = await this.pool.query(query, [providerId]);
    return result.rows[0];
  }

  async findByProvider(
    providerId: string,
  ): Promise<ProviderReviewAggregate | null> {
    const query = `SELECT * FROM provider_review_aggregates WHERE provider_id = $1`;
    const result = await this.pool.query(query, [providerId]);
    return result.rows[0] || null;
  }

  async findTopRated(limit: number = 10): Promise<ProviderReviewAggregate[]> {
    const query = `
      SELECT pra.*, p.business_name, p.user_id
      FROM provider_review_aggregates pra
      JOIN providers p ON pra.provider_id = p.id
      WHERE pra.total_reviews >= 5
      ORDER BY pra.average_rating DESC, pra.total_reviews DESC
      LIMIT $1
    `;
    const result = await this.pool.query(query, [limit]);
    return result.rows;
  }

  async findByRatingRange(
    minRating: number,
    maxRating: number,
    limit: number = 20,
  ): Promise<ProviderReviewAggregate[]> {
    const query = `
      SELECT pra.*, p.business_name
      FROM provider_review_aggregates pra
      JOIN providers p ON pra.provider_id = p.id
      WHERE pra.average_rating BETWEEN $1 AND $2
      ORDER BY pra.total_reviews DESC
      LIMIT $3
    `;
    const result = await this.pool.query(query, [minRating, maxRating, limit]);
    return result.rows;
  }

  async refreshAll(): Promise<number> {
    const query = `
      INSERT INTO provider_review_aggregates (
        provider_id, total_reviews, average_rating,
        rating_1_count, rating_2_count, rating_3_count, rating_4_count, rating_5_count,
        last_review_at, updated_at
      )
      SELECT
        provider_id,
        COUNT(*) as total_reviews,
        ROUND(AVG(rating)::numeric, 2) as average_rating,
        COUNT(*) FILTER (WHERE rating = 1) as rating_1_count,
        COUNT(*) FILTER (WHERE rating = 2) as rating_2_count,
        COUNT(*) FILTER (WHERE rating = 3) as rating_3_count,
        COUNT(*) FILTER (WHERE rating = 4) as rating_4_count,
        COUNT(*) FILTER (WHERE rating = 5) as rating_5_count,
        MAX(created_at) as last_review_at,
        NOW() as updated_at
      FROM reviews
      GROUP BY provider_id
      ON CONFLICT (provider_id)
      DO UPDATE SET
        total_reviews = EXCLUDED.total_reviews,
        average_rating = EXCLUDED.average_rating,
        rating_1_count = EXCLUDED.rating_1_count,
        rating_2_count = EXCLUDED.rating_2_count,
        rating_3_count = EXCLUDED.rating_3_count,
        rating_4_count = EXCLUDED.rating_4_count,
        rating_5_count = EXCLUDED.rating_5_count,
        last_review_at = EXCLUDED.last_review_at,
        updated_at = NOW()
    `;

    const result = await this.pool.query(query);
    return result.rowCount || 0;
  }

  async refreshRecent(hoursWindow: number): Promise<number> {
    const query = `
      WITH recent_providers AS (
        SELECT DISTINCT provider_id
        FROM reviews
        WHERE created_at >= NOW() - (($1::text || ' hours')::interval)
      )
      INSERT INTO provider_review_aggregates (
        provider_id, total_reviews, average_rating,
        rating_1_count, rating_2_count, rating_3_count, rating_4_count, rating_5_count,
        last_review_at, updated_at
      )
      SELECT
        r.provider_id,
        COUNT(*) as total_reviews,
        ROUND(AVG(r.rating)::numeric, 2) as average_rating,
        COUNT(*) FILTER (WHERE r.rating = 1) as rating_1_count,
        COUNT(*) FILTER (WHERE r.rating = 2) as rating_2_count,
        COUNT(*) FILTER (WHERE r.rating = 3) as rating_3_count,
        COUNT(*) FILTER (WHERE r.rating = 4) as rating_4_count,
        COUNT(*) FILTER (WHERE r.rating = 5) as rating_5_count,
        MAX(r.created_at) as last_review_at,
        NOW() as updated_at
      FROM reviews r
      INNER JOIN recent_providers rp ON rp.provider_id = r.provider_id
      GROUP BY r.provider_id
      ON CONFLICT (provider_id)
      DO UPDATE SET
        total_reviews = EXCLUDED.total_reviews,
        average_rating = EXCLUDED.average_rating,
        rating_1_count = EXCLUDED.rating_1_count,
        rating_2_count = EXCLUDED.rating_2_count,
        rating_3_count = EXCLUDED.rating_3_count,
        rating_4_count = EXCLUDED.rating_4_count,
        rating_5_count = EXCLUDED.rating_5_count,
        last_review_at = EXCLUDED.last_review_at,
        updated_at = NOW()
    `;

    const result = await this.pool.query(query, [hoursWindow]);
    return result.rowCount || 0;
  }

  async refreshAllAggregates(): Promise<number> {
    return this.refreshAll();
  }

  async refreshRecentAggregates(): Promise<number> {
    return this.refreshRecent(4);
  }

  async refreshByProvider(providerId: string): Promise<void> {
    const query = `
      INSERT INTO provider_review_aggregates (
        provider_id, total_reviews, average_rating,
        rating_1_count, rating_2_count, rating_3_count, rating_4_count, rating_5_count,
        last_review_at, updated_at
      )
      SELECT
        provider_id,
        COUNT(*) as total_reviews,
        ROUND(AVG(rating)::numeric, 2) as average_rating,
        COUNT(*) FILTER (WHERE rating = 1) as rating_1_count,
        COUNT(*) FILTER (WHERE rating = 2) as rating_2_count,
        COUNT(*) FILTER (WHERE rating = 3) as rating_3_count,
        COUNT(*) FILTER (WHERE rating = 4) as rating_4_count,
        COUNT(*) FILTER (WHERE rating = 5) as rating_5_count,
        MAX(created_at) as last_review_at,
        NOW() as updated_at
      FROM reviews
      WHERE provider_id = $1
      GROUP BY provider_id
      ON CONFLICT (provider_id)
      DO UPDATE SET
        total_reviews = EXCLUDED.total_reviews,
        average_rating = EXCLUDED.average_rating,
        rating_1_count = EXCLUDED.rating_1_count,
        rating_2_count = EXCLUDED.rating_2_count,
        rating_3_count = EXCLUDED.rating_3_count,
        rating_4_count = EXCLUDED.rating_4_count,
        rating_5_count = EXCLUDED.rating_5_count,
        last_review_at = EXCLUDED.last_review_at,
        updated_at = NOW()
    `;
    await this.pool.query(query, [providerId]);
  }
}
