import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { FeatureFlag } from '../entities/feature-flag.entity';
import { CreateFeatureFlagDto } from '../dto/create-feature-flag.dto';
import { UpdateFeatureFlagDto } from '../dto/update-feature-flag.dto';

@Injectable()
export class FeatureFlagRepository {
  constructor(@Inject('DATABASE_POOL') private readonly pool: Pool) {}

  async createFeatureFlag(createFlagDto: CreateFeatureFlagDto): Promise<FeatureFlag> {
    const query = `
      INSERT INTO feature_flags (key, enabled, rollout_percentage)
      VALUES ($1, $2, $3)
      RETURNING key, enabled, rollout_percentage
    `;

    const values = [
      createFlagDto.key,
      createFlagDto.enabled,
      createFlagDto.rollout_percentage,
    ];

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async getFeatureFlagByKey(key: string): Promise<FeatureFlag | null> {
    const query = `
      SELECT key, enabled, rollout_percentage
      FROM feature_flags
      WHERE key = $1
    `;

    const result = await this.pool.query(query, [key]);
    return result.rows[0] || null;
  }

  async getAllFeatureFlags(): Promise<FeatureFlag[]> {
    const query = `
      SELECT key, enabled, rollout_percentage
      FROM feature_flags
      ORDER BY key ASC
    `;

    const result = await this.pool.query(query);
    return result.rows;
  }

  async updateFeatureFlag(
    key: string,
    updateFlagDto: UpdateFeatureFlagDto,
  ): Promise<FeatureFlag | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updateFlagDto.enabled !== undefined) {
      updates.push(`enabled = $${paramCount++}`);
      values.push(updateFlagDto.enabled);
    }

    if (updateFlagDto.rolloutPercentage !== undefined) {
      updates.push(`rollout_percentage = $${paramCount++}`);
      values.push(updateFlagDto.rolloutPercentage);
    }

    if (updates.length === 0) {
      return this.getFeatureFlagByKey(key);
    }

    values.push(key);

    const query = `
      UPDATE feature_flags
      SET ${updates.join(', ')}
      WHERE key = $${paramCount}
      RETURNING key, enabled, rollout_percentage as "rolloutPercentage"
    `;

    const result = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  async deleteFeatureFlag(key: string): Promise<void> {
    const query = `DELETE FROM feature_flags WHERE key = $1`;
    await this.pool.query(query, [key]);
  }

  async getEnabledFeatureFlags(): Promise<FeatureFlag[]> {
    const query = `
      SELECT key, enabled, rollout_percentage as "rolloutPercentage"
      FROM feature_flags
      WHERE enabled = true
      ORDER BY key ASC
    `;

    const result = await this.pool.query(query);
    return result.rows;
  }
}
