import {
  Injectable,
  OnModuleInit,
  Inject,
  LoggerService,
} from "@nestjs/common";
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";
import { RedisService } from "./redis.service";
import { CategoryRepository } from "../modules/request/repositories/category.repository";

@Injectable()
export class CacheWarmingService implements OnModuleInit {
  private readonly CATEGORY_CACHE_TTL = 3600; // 1 hour

  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly redisService: RedisService,
    private readonly categoryRepository: CategoryRepository,
  ) { }

  async onModuleInit() {
    if (!this.redisService.isCacheEnabled()) {
      this.logger.log(
        "Cache warming skipped - cache is disabled",
        "CacheWarmingService",
      );
      return;
    }

    this.logger.log("Starting cache warming...", "CacheWarmingService");

    try {
      await this.warmCategoryCache();

      this.logger.log(
        "Cache warming completed successfully",
        "CacheWarmingService",
      );
    } catch (error: any) {
      this.logger.error(
        `Cache warming failed: ${error.message}`,
        error.stack,
        "CacheWarmingService",
      );
      // Don't throw - cache warming failure shouldn't prevent app startup
    }
  }

  private async warmCategoryCache(): Promise<void> {
    try {
      this.logger.log("Warming category cache...", "CacheWarmingService");

      // Fetch all categories from database
      const categories = await this.categoryRepository.getAllCategories();

      // Cache the complete category list
      await this.redisService.set(
        "categories:all",
        JSON.stringify(categories),
        this.CATEGORY_CACHE_TTL,
      );

      // Cache individual categories
      for (const category of categories) {
        const cacheKey = `category:${category.id}`;
        await this.redisService.set(
          cacheKey,
          JSON.stringify(category),
          this.CATEGORY_CACHE_TTL,
        );
      }

      this.logger.log(
        `Category cache warmed: ${categories.length} categories cached`,
        "CacheWarmingService",
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to warm category cache: ${error.message}`,
        error.stack,
        "CacheWarmingService",
      );
    }
  }
}
