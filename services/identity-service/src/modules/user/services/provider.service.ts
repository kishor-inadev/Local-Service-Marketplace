import { Injectable, Inject } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { Logger } from "winston";
import { ProviderRepository } from "../repositories/provider.repository";
import { ProviderServiceRepository } from "../repositories/provider-service.repository";
import { ProviderAvailabilityRepository } from "../repositories/provider-availability.repository";
import { CreateProviderDto } from "../dto/create-provider.dto";
import { UpdateProviderDto } from "../dto/update-provider.dto";
import { ProviderQueryDto } from "../dto/provider-query.dto";
import { ProviderResponseDto } from "../dto/provider-response.dto";
import { PaginatedResponseDto } from "../dto/paginated-response.dto";
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from "@/common/exceptions/http.exceptions";
import { RedisService } from "../../../redis/redis.service";
import { NotificationClient } from "../../../common/notification/notification.client";
import { UserRepository } from "../repositories/user.repository";

@Injectable()
export class ProviderService {
  private readonly defaultLimit: number;
  private readonly PROVIDER_CACHE_TTL = 300; // 5 minutes

  constructor(
    private readonly providerRepo: ProviderRepository,
    private readonly providerServiceRepo: ProviderServiceRepository,
    private readonly providerAvailabilityRepo: ProviderAvailabilityRepository,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly notificationClient: NotificationClient,
    private readonly userRepo: UserRepository,
  ) {
    this.defaultLimit = parseInt(
      this.configService.get<string>("DEFAULT_PAGE_LIMIT", "20"),
      10,
    );
  }

  async createProvider(
    createProviderDto: CreateProviderDto,
  ): Promise<ProviderResponseDto> {
    const {
      user_id,
      business_name,
      description,
      service_categories,
      availability,
    } = createProviderDto;

    this.logger.info("Creating provider", {
      context: "ProviderService",
      user_id,
      business_name,
    });

    // Check if provider already exists for this user
    const existingProvider = await this.providerRepo.findByUserId(user_id);
    if (existingProvider) {
      throw new ConflictException(
        "Provider profile already exists for this user",
      );
    }

    // Create provider
    const provider = await this.providerRepo.create(
      user_id,
      business_name,
      description,
    );

    // Add service categories
    if (service_categories && service_categories.length > 0) {
      for (const categoryId of service_categories) {
        await this.providerServiceRepo.create(provider.id, categoryId);
      }
    }

    // Add availability
    if (availability && availability.length > 0) {
      for (const slot of availability) {
        await this.providerAvailabilityRepo.create(
          provider.id,
          slot.day_of_week,
          slot.start_time,
          slot.end_time,
        );
      }
    }

    this.logger.info("Provider created successfully", {
      context: "ProviderService",
      provider_id: provider.id,
    });

    // Send welcome notification to provider
    const providerUser = await this.userRepo.findById(user_id);
    if (providerUser?.email) {
      this.notificationClient
        .sendEmail({
          to: providerUser.email,
          template: "welcome",
          variables: {
            name: business_name,
            message: "Your provider profile has been created successfully!",
            dashboardUrl: `${process.env.FRONTEND_URL || "http://localhost:3000"}/provider/dashboard`,
          },
        })
        .catch((err) => {
          this.logger.error("Failed to send provider welcome notification", {
            context: "ProviderService",
            error: err.message,
            provider_id: provider.id,
          });
        });
    } else {
      this.logger.warn(
        "Skipping provider welcome notification: provider email not found",
        {
          context: "ProviderService",
          provider_id: provider.id,
          user_id,
        },
      );
    }

    // Invalidate cache
    if (this.redisService.isCacheEnabled()) {
      await this.redisService.delPattern("provider:*");
    }

    return this.getProvider(provider.id);
  }

  async updateProvider(
    providerId: string,
    updateProviderDto: UpdateProviderDto,
  ): Promise<ProviderResponseDto> {
    const { business_name, description, service_categories, availability } =
      updateProviderDto;

    this.logger.info("Updating provider", {
      context: "ProviderService",
      provider_id: providerId,
    });

    const provider = await this.providerRepo.findById(providerId);
    if (!provider) {
      throw new NotFoundException("Provider not found");
    }

    // Update basic info
    if (business_name !== undefined || description !== undefined) {
      await this.providerRepo.update(provider.id, business_name, description);
    }

    // Update service categories
    if (service_categories !== undefined) {
      await this.providerServiceRepo.replaceServices(
        provider.id,
        service_categories,
      );
    }

    // Update availability
    if (availability !== undefined) {
      await this.providerAvailabilityRepo.replaceAvailability(
        provider.id,
        availability,
      );
    }

    this.logger.info("Provider updated successfully", {
      context: "ProviderService",
      provider_id: provider.id,
    });

    // Invalidate cache for this provider
    if (this.redisService.isCacheEnabled()) {
      await this.redisService.del(`provider:${provider.id}`);
    }

    return this.getProvider(provider.id);
  }

  async getProvider(providerId: string): Promise<ProviderResponseDto> {
    this.logger.info("Fetching provider", {
      context: "ProviderService",
      provider_id: providerId,
    });

    // Try cache first
    if (this.redisService.isCacheEnabled()) {
      const cacheKey = `provider:${providerId}`;
      const cached = await this.redisService.get(cacheKey);

      if (cached) {
        this.logger.info("Cache hit for provider", {
          context: "ProviderService",
          provider_id: providerId,
        });
        return JSON.parse(cached);
      }
    }

    const provider = await this.providerRepo.findById(providerId);
    if (!provider) {
      throw new NotFoundException("Provider not found");
    }

    // Get services
    const services = await this.providerServiceRepo.findByProviderId(
      provider.id,
    );

    // Get availability
    const availability = await this.providerAvailabilityRepo.findByProviderId(
      provider.id,
    );

    const response = {
      id: provider.id,
      user_id: provider.user_id,
      business_name: provider.business_name,
      description: provider.description,
      rating: provider.rating,
      services: services.map((s) => ({ id: s.id, category_id: s.category_id })),
      availability: availability.map((a) => ({
        id: a.id,
        day_of_week: a.day_of_week,
        start_time: a.start_time,
        end_time: a.end_time,
      })),
      created_at: provider.created_at,
    };

    // Cache the result
    if (this.redisService.isCacheEnabled()) {
      const cacheKey = `provider:${provider.id}`;
      await this.redisService.set(
        cacheKey,
        JSON.stringify(response),
        this.PROVIDER_CACHE_TTL,
      );
    }

    return response;
  }

  async getProviders(
    queryDto: ProviderQueryDto,
  ): Promise<PaginatedResponseDto<ProviderResponseDto>> {
    const limit = queryDto.limit || this.defaultLimit;
    const maxLimit = parseInt(
      this.configService.get<string>("MAX_PAGE_LIMIT", "100"),
      10,
    );

    if (limit > maxLimit) {
      throw new BadRequestException(`Limit cannot exceed ${maxLimit}`);
    }

    if (
      queryDto.min_rating !== undefined &&
      queryDto.max_rating !== undefined &&
      queryDto.min_rating > queryDto.max_rating
    ) {
      throw new BadRequestException(
        "min_rating cannot be greater than max_rating",
      );
    }

    this.logger.info("Fetching providers", {
      context: "ProviderService",
      limit,
      cursor: queryDto.cursor,
      page: queryDto.page,
      category_id: queryDto.category_id,
      sortBy: queryDto.sortBy,
      sortOrder: queryDto.sortOrder,
      verification_status: queryDto.verification_status,
      min_rating: queryDto.min_rating,
      max_rating: queryDto.max_rating,
    });

    // Use cursor mode only when cursor param is explicitly provided
    if (queryDto.cursor) {
      // Fetch one extra to determine if there are more results
      const providers = await this.providerRepo.findPaginated(
        limit + 1,
        queryDto.cursor,
        queryDto.category_id,
        queryDto.search,
        queryDto.location_id,
        undefined,
        queryDto.sortBy,
        queryDto.sortOrder,
        queryDto.verification_status,
        queryDto.min_rating,
        queryDto.max_rating,
        queryDto.user_id,
      );

      const hasMore = providers.length > limit;
      const data = providers.slice(0, limit);
      const providerResponses = await this.buildProviderResponses(data);
      const nextCursor =
        hasMore && data.length > 0 ? data[data.length - 1].id : undefined;

      return { data: providerResponses, nextCursor, hasMore };
    }

    // Default: page-based pagination
    const page = queryDto.page || 1;
    const offset = (page - 1) * limit;

    const [providers, total] = await Promise.all([
      this.providerRepo.findPaginated(
        limit,
        undefined,
        queryDto.category_id,
        queryDto.search,
        queryDto.location_id,
        offset,
        queryDto.sortBy,
        queryDto.sortOrder,
        queryDto.verification_status,
        queryDto.min_rating,
        queryDto.max_rating,
        queryDto.user_id,
      ),
      this.providerRepo.countProviders(
        queryDto.category_id,
        queryDto.search,
        queryDto.location_id,
        queryDto.verification_status,
        queryDto.min_rating,
        queryDto.max_rating,
        queryDto.user_id,
      ),
    ]);

    const providerResponses = await this.buildProviderResponses(providers);

    return { data: providerResponses, total, page, limit };
  }

  private async buildProviderResponses(
    providers: any[],
  ): Promise<ProviderResponseDto[]> {
    const responses: ProviderResponseDto[] = [];
    for (const provider of providers) {
      const services = await this.providerServiceRepo.findByProviderId(
        provider.id,
      );
      const availability = await this.providerAvailabilityRepo.findByProviderId(
        provider.id,
      );
      responses.push({
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
      });
    }
    return responses;
  }

  async addProviderService(providerId: string, categoryId: string): Promise<any> {
    const provider = await this.providerRepo.findById(providerId);
    if (!provider) {
      throw new NotFoundException("Provider not found");
    }
    
    const existingServices = await this.providerServiceRepo.findByProviderId(provider.id);
    if (existingServices.some(s => s.category_id === categoryId)) {
      throw new ConflictException("Service category already mapped to this provider");
    }

    const newService = await this.providerServiceRepo.create(provider.id, categoryId);
    
    if (this.redisService.isCacheEnabled()) {
      await this.redisService.del(`provider:${provider.id}`);
    }

    return {
      id: newService.id,
      provider_id: provider.id,
      category_id: categoryId
    };
  }

  async removeProviderService(providerId: string, serviceId: string): Promise<void> {
    await this.providerServiceRepo.deleteById(serviceId);
    
    if (this.redisService.isCacheEnabled()) {
      await this.redisService.del(`provider:${providerId}`);
    }
  }

  async getProviderServices(providerId: string): Promise<any[]> {
    const provider = await this.providerRepo.findById(providerId);
    if (!provider) {
      throw new NotFoundException("Provider not found");
    }
    const services = await this.providerServiceRepo.findByProviderId(provider.id);
    return services.map(s => ({
      id: s.id,
      provider_id: provider.id,
      category_id: s.category_id
    }));
  }

  async deleteProvider(providerId: string): Promise<void> {
    this.logger.info("Deleting provider", {
      context: "ProviderService",
      provider_id: providerId,
    });

    const provider = await this.providerRepo.findById(providerId);
    if (!provider) {
      throw new NotFoundException("Provider not found");
    }

    // Delete related records
    await this.providerServiceRepo.deleteByProviderId(provider.id);
    await this.providerAvailabilityRepo.deleteByProviderId(provider.id);

    // Delete provider
    await this.providerRepo.delete(provider.id);

    this.logger.info("Provider deleted successfully", {
      context: "ProviderService",
      provider_id: providerId,
    });
  }
}
