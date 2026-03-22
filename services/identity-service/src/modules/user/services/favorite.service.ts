import { Injectable, Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { FavoriteRepository } from '../repositories/favorite.repository';
import { ProviderRepository } from '../repositories/provider.repository';
import { CreateFavoriteDto } from '../dto/create-favorite.dto';
import {
  NotFoundException,
  ConflictException,
} from '@/common/exceptions/http.exceptions';

@Injectable()
export class FavoriteService {
  constructor(
    private readonly favoriteRepo: FavoriteRepository,
    private readonly providerRepo: ProviderRepository,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async saveFavorite(createFavoriteDto: CreateFavoriteDto): Promise<any> {
    const { user_id, provider_id } = createFavoriteDto;

    this.logger.info('Saving favorite provider', {
      context: 'FavoriteService',
      user_id,
      provider_id,
    });

    // Check if provider exists
    const provider = await this.providerRepo.findById(provider_id);
    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    // Check if already favorited
    const existing = await this.favoriteRepo.findOne(user_id, provider_id);
    if (existing) {
      throw new ConflictException('Provider already in favorites');
    }

    const favorite = await this.favoriteRepo.create(user_id, provider_id);

    this.logger.info('Favorite saved successfully', {
      context: 'FavoriteService',
      favorite_id: favorite.id,
    });

    return {
      id: favorite.id,
      user_id: favorite.user_id,
      provider_id: favorite.provider_id,
      created_at: favorite.created_at,
    };
  }

  async getFavorites(userId: string): Promise<any[]> {
    this.logger.info('Fetching user favorites', {
      context: 'FavoriteService',
      user_id: userId,
    });

    const favorites = await this.favoriteRepo.findByUserId(userId);

    return favorites.map((fav) => ({
      id: fav.id,
      provider_id: fav.provider_id,
      provider_name: fav['business_name'],
      provider_description: fav['description'],
      provider_rating: fav['rating'],
      created_at: fav.created_at,
    }));
  }

  async removeFavorite(userId: string, providerId: string): Promise<void> {
    this.logger.info('Removing favorite provider', {
      context: 'FavoriteService',
      user_id: userId,
      provider_id: providerId,
    });

    const favorite = await this.favoriteRepo.findOne(userId, providerId);
    if (!favorite) {
      throw new NotFoundException('Favorite not found');
    }

    await this.favoriteRepo.delete(userId, providerId);

    this.logger.info('Favorite removed successfully', {
      context: 'FavoriteService',
      user_id: userId,
      provider_id: providerId,
    });
  }
}
