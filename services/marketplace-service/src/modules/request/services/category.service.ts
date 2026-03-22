import { Injectable, Inject, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { CategoryRepository } from '../repositories/category.repository';
import { ServiceCategory } from '../entities/service-category.entity';
import { NotFoundException } from '../../../common/exceptions/http.exceptions';
import { RedisService } from '../../../redis/redis.service';

@Injectable()
export class CategoryService {
  private readonly CATEGORY_CACHE_TTL = 3600; // 1 hour - categories rarely change

  constructor(
    private readonly categoryRepository: CategoryRepository,
    private readonly redisService: RedisService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
  ) {}

  async getAllCategories(): Promise<ServiceCategory[]> {
    this.logger.log('Fetching all categories', CategoryService.name);

    // Try cache first
    if (this.redisService.isCacheEnabled()) {
      const cached = await this.redisService.get('categories:all');
      if (cached) {
        this.logger.log('Cache hit for categories:all', CategoryService.name);
        return JSON.parse(cached);
      }
    }

    const categories = await this.categoryRepository.getAllCategories();

    // Cache the result
    if (this.redisService.isCacheEnabled()) {
      await this.redisService.set('categories:all', JSON.stringify(categories), this.CATEGORY_CACHE_TTL);
    }

    return categories;
  }

  async getCategoryById(id: string): Promise<ServiceCategory> {
    this.logger.log(`Fetching category: ${id}`, CategoryService.name);

    // Try cache first
    if (this.redisService.isCacheEnabled()) {
      const cacheKey = `category:${id}`;
      const cached = await this.redisService.get(cacheKey);
      if (cached) {
        this.logger.log(`Cache hit for category: ${id}`, CategoryService.name);
        return JSON.parse(cached);
      }
    }

    const category = await this.categoryRepository.getCategoryById(id);

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Cache the result
    if (this.redisService.isCacheEnabled()) {
      const cacheKey = `category:${id}`;
      await this.redisService.set(cacheKey, JSON.stringify(category), this.CATEGORY_CACHE_TTL);
    }

    return category;
  }

  async createCategory(name: string): Promise<ServiceCategory> {
    this.logger.log(`Creating category: ${name}`, CategoryService.name);

    const category = await this.categoryRepository.createCategory(name);

    this.logger.log(`Category created: ${category.id}`, CategoryService.name);

    // Invalidate category cache
    if (this.redisService.isCacheEnabled()) {
      await this.redisService.del('categories:all');
    }

    return category;
  }

  async categoryExists(id: string): Promise<boolean> {
    return this.categoryRepository.categoryExists(id);
  }

  async searchCategories(searchTerm: string, limit: number = 10): Promise<ServiceCategory[]> {
    this.logger.log(`Searching categories: ${searchTerm}`, CategoryService.name);

    // Skip cache for search - always get fresh results
    const categories = await this.categoryRepository.searchCategories(searchTerm, limit);

    return categories;
  }
}
