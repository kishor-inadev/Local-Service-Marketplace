import { Injectable, Inject, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { FeatureFlagRepository } from '../repositories/feature-flag.repository';
import { RedisService } from '../../redis/redis.service';
import { CreateFeatureFlagDto } from '../dto/create-feature-flag.dto';
import { UpdateFeatureFlagDto } from '../dto/update-feature-flag.dto';
import { FeatureFlag } from '../entities/feature-flag.entity';

@Injectable()
export class FeatureFlagService {
  private readonly CACHE_TTL = 300; // 5 minutes cache

  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly featureFlagRepository: FeatureFlagRepository,
    private readonly redisService: RedisService,
  ) {}

  async createFeatureFlag(createFlagDto: CreateFeatureFlagDto): Promise<FeatureFlag> {
    try {
      const flag = await this.featureFlagRepository.createFeatureFlag(createFlagDto);

      // Cache the flag
      const cacheKey = `feature_flag:${flag.key}`;
      await this.redisService.set(cacheKey, JSON.stringify(flag), this.CACHE_TTL);

      this.logger.log(
        `Feature flag created: ${flag.key}`,
        'FeatureFlagService',
      );

      return flag;
    } catch (error) {
      this.logger.error(
        `Failed to create feature flag: ${error.message}`,
        error.stack,
        'FeatureFlagService',
      );
      throw error;
    }
  }

  async getFeatureFlagByKey(key: string): Promise<FeatureFlag | null> {
    try {
      // Check cache first
      const cacheKey = `feature_flag:${key}`;
      const cached = await this.redisService.get(cacheKey);

      if (cached) {
        this.logger.log(
          `Feature flag retrieved from cache: ${key}`,
          'FeatureFlagService',
        );
        return JSON.parse(cached);
      }

      // Fetch from database
      const flag = await this.featureFlagRepository.getFeatureFlagByKey(key);

      if (flag) {
        // Cache it
        await this.redisService.set(cacheKey, JSON.stringify(flag), this.CACHE_TTL);
      }

      this.logger.log(
        `Feature flag retrieved from database: ${key}`,
        'FeatureFlagService',
      );

      return flag;
    } catch (error) {
      this.logger.error(
        `Failed to get feature flag: ${error.message}`,
        error.stack,
        'FeatureFlagService',
      );
      throw error;
    }
  }

  async getAllFeatureFlags(): Promise<FeatureFlag[]> {
    try {
      const flags = await this.featureFlagRepository.getAllFeatureFlags();

      this.logger.log(
        `Retrieved ${flags.length} feature flags`,
        'FeatureFlagService',
      );

      return flags;
    } catch (error) {
      this.logger.error(
        `Failed to get all feature flags: ${error.message}`,
        error.stack,
        'FeatureFlagService',
      );
      throw error;
    }
  }

  async updateFeatureFlag(
    key: string,
    updateFlagDto: UpdateFeatureFlagDto,
  ): Promise<FeatureFlag | null> {
    try {
      const flag = await this.featureFlagRepository.updateFeatureFlag(key, updateFlagDto);

      if (flag) {
        // Update cache
        const cacheKey = `feature_flag:${key}`;
        await this.redisService.set(cacheKey, JSON.stringify(flag), this.CACHE_TTL);
      }

      this.logger.log(
        `Feature flag updated: ${key}`,
        'FeatureFlagService',
      );

      return flag;
    } catch (error) {
      this.logger.error(
        `Failed to update feature flag: ${error.message}`,
        error.stack,
        'FeatureFlagService',
      );
      throw error;
    }
  }

  async deleteFeatureFlag(key: string): Promise<void> {
    try {
      await this.featureFlagRepository.deleteFeatureFlag(key);

      // Remove from cache
      const cacheKey = `feature_flag:${key}`;
      await this.redisService.del(cacheKey);

      this.logger.log(
        `Feature flag deleted: ${key}`,
        'FeatureFlagService',
      );
    } catch (error) {
      this.logger.error(
        `Failed to delete feature flag: ${error.message}`,
        error.stack,
        'FeatureFlagService',
      );
      throw error;
    }
  }

  async isFeatureEnabled(key: string, userId?: string): Promise<boolean> {
    try {
      const flag = await this.getFeatureFlagByKey(key);

      if (!flag) {
        this.logger.log(
          `Feature flag not found: ${key} - defaulting to false`,
          'FeatureFlagService',
        );
        return false;
      }

      if (!flag.enabled) {
        return false;
      }

      // Check rollout percentage
      if (flag.rollout_percentage < 100 && userId) {
        // Use consistent hashing for gradual rollout
        const hash = this.hashString(userId);
        const percentage = hash % 100;
        return percentage < flag.rollout_percentage;
      }

      return flag.rollout_percentage === 100;
    } catch (error) {
      this.logger.error(
        `Failed to check feature enabled: ${error.message}`,
        error.stack,
        'FeatureFlagService',
      );
      // On error, default to false to prevent enabling untested features
      return false;
    }
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}
