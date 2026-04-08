import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { ProviderPortfolioRepository } from "../repositories/provider-portfolio.repository";
import { CreatePortfolioDto } from "../dto/create-portfolio.dto";
import { ProviderPortfolio } from "../entities/provider-portfolio.entity";

@Injectable()
export class ProviderPortfolioService {
  constructor(
    private readonly portfolioRepository: ProviderPortfolioRepository,
  ) {}

  async createPortfolioItem(
    providerId: string,
    userId: string,
    dto: CreatePortfolioDto,
    imageUrls: string[],
  ): Promise<ProviderPortfolio> {
    // Authorization: verify user owns this provider profile
    // This should be handled at controller level with guards

    if (imageUrls.length === 0) {
      throw new BadRequestException("At least one image is required");
    }

    if (imageUrls.length > 10) {
      throw new BadRequestException(
        "Maximum 10 images allowed per portfolio item",
      );
    }

    // Get the current max display_order for this provider
    const existingItems =
      await this.portfolioRepository.findByProvider(providerId);
    const maxOrder =
      existingItems.length > 0
        ? Math.max(...existingItems.map((item) => item.display_order))
        : 0;

    // Store first image URL (database supports single image_url for now)
    return this.portfolioRepository.create({
      provider_id: providerId,
      title: dto.title,
      description: dto.description,
      image_url: imageUrls[0], // Store first image
      display_order: maxOrder + 1,
    });
  }

  async getProviderPortfolio(
    providerId: string,
  ): Promise<{ data: ProviderPortfolio[]; total: number }> {
    const data = await this.portfolioRepository.findByProvider(providerId);
    return { data, total: data.length };
  }

  async getPortfolioItemById(itemId: string): Promise<ProviderPortfolio> {
    const item = await this.portfolioRepository.findById(itemId);

    if (!item) {
      throw new NotFoundException("Portfolio item not found");
    }

    return item;
  }

  async updatePortfolioItem(
    itemId: string,
    userId: string,
    updateData: { title?: string; description?: string; image_urls?: string[] },
  ): Promise<ProviderPortfolio> {
    const item = await this.portfolioRepository.findById(itemId);

    if (!item) {
      throw new NotFoundException("Portfolio item not found");
    }

    // Authorization: verify user owns this provider
    // This would involve checking provider ownership

    if (updateData.image_urls && updateData.image_urls.length > 10) {
      throw new BadRequestException(
        "Maximum 10 images allowed per portfolio item",
      );
    }

    return this.portfolioRepository.update(itemId, updateData);
  }

  async deletePortfolioItem(itemId: string, userId: string): Promise<void> {
    const item = await this.portfolioRepository.findById(itemId);

    if (!item) {
      throw new NotFoundException("Portfolio item not found");
    }

    // Authorization: verify user owns this provider

    await this.portfolioRepository.delete(itemId);
  }

  async reorderPortfolio(
    providerId: string,
    userId: string,
    orderedIds: string[],
  ): Promise<ProviderPortfolio[]> {
    // Authorization: verify user owns this provider

    const existingItems =
      await this.portfolioRepository.findByProvider(providerId);

    // Verify all IDs belong to this provider
    const providerItemIds = existingItems.map((item) => item.id);
    const invalidIds = orderedIds.filter((id) => !providerItemIds.includes(id));

    if (invalidIds.length > 0) {
      throw new BadRequestException(
        `Invalid portfolio item IDs: ${invalidIds.join(", ")}`,
      );
    }

    // Create itemOrders array with order indices
    const itemOrders = orderedIds.map((id, index) => ({
      id,
      order: index + 1,
    }));
    await this.portfolioRepository.reorderPortfolio(providerId, itemOrders);

    return this.portfolioRepository.findByProvider(providerId);
  }
}
