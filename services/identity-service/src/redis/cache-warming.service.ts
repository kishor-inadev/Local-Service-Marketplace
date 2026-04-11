import { Injectable, OnModuleInit, Inject } from "@nestjs/common";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { Logger } from "winston";
import { RedisService } from "./redis.service";
import { ProviderRepository } from "../modules/user/repositories/provider.repository";
import { ProviderServiceRepository } from "../modules/user/repositories/provider-service.repository";
import { ProviderAvailabilityRepository } from "../modules/user/repositories/provider-availability.repository";

@Injectable()
export class CacheWarmingService implements OnModuleInit {
  private readonly PROVIDER_CACHE_TTL = 300; // 5 minutes

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly redisService: RedisService,
    private readonly providerRepo: ProviderRepository,
    private readonly providerServiceRepo: ProviderServiceRepository,
    private readonly providerAvailabilityRepo: ProviderAvailabilityRepository,
  ) { }

  async onModuleInit() {
    if (!this.redisService.isCacheEnabled()) {
      this.logger.info("Cache warming skipped - cache is disabled", {
        context: "CacheWarmingService",
      });
      return;
    }

    this.logger.info("Starting cache warming...", {
      context: "CacheWarmingService",
    });

    try {
      await this.warmTopProvidersCache();

      this.logger.info("Cache warming completed successfully", {
        context: "CacheWarmingService",
      });
    } catch (error: any) {
      this.logger.error("Cache warming failed", {
        context: "CacheWarmingService",
        error: error.message,
        stack: error.stack,
      });
      // Don't throw - cache warming failure shouldn't prevent app startup
    }
  }

  private async warmTopProvidersCache(): Promise<void> {
    try {
      this.logger.info("Warming provider cache...", {
        context: "CacheWarmingService",
      });

      // Fetch top 50 providers (most likely to be accessed)
      const providers = await this.providerRepo.findPaginated(
        50,
        null,
        null,
        null,
        null,
      );

      let cachedCount = 0;

      // Parallelize per-provider lookups — was 101 sequential queries (1 + 50 + 50)
      await Promise.all(
        providers.map(async (provider) => {
          try {
            const [services, availability] = await Promise.all([
              this.providerServiceRepo.findByProviderId(provider.id),
              this.providerAvailabilityRepo.findByProviderId(provider.id),
            ]);

            const response = {
              id: provider.id,
              user_id: provider.user_id,
              business_name: provider.business_name,
              description: provider.description,
              rating: provider.rating,
              services: services.map((s) => ({
                id: s.id,
                category_id: s.category_id,
              })),
              availability: availability.map((a) => ({
                id: a.id,
                day_of_week: a.day_of_week,
                start_time: a.start_time,
                end_time: a.end_time,
              })),
              created_at: provider.created_at,
            };

            const cacheKey = `provider:${provider.id}`;
            await this.redisService.set(
              cacheKey,
              JSON.stringify(response),
              this.PROVIDER_CACHE_TTL,
            );

            cachedCount++;
          } catch (error: any) {
            this.logger.warn("Failed to cache provider", {
              context: "CacheWarmingService",
              providerId: provider.id,
              error: error.message,
            });
          }
        }),
      );

      this.logger.info("Provider cache warmed", {
        context: "CacheWarmingService",
        cachedCount,
      });
    } catch (error: any) {
      this.logger.error("Failed to warm provider cache", {
        context: "CacheWarmingService",
        error: error.message,
        stack: error.stack,
      });
    }
  }
}
