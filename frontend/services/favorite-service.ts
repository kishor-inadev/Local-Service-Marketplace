import { apiClient } from './api-client';

export interface Favorite {
  id: string;
  provider_id: string;
  provider_name: string;
  provider_description: string;
  provider_rating: number;
  created_at: string;
}

export interface CreateFavoriteData {
  user_id: string;
  provider_id: string;
}

class FavoriteService {
  async getFavorites(userId: string): Promise<Favorite[]> {
    const response = await apiClient.get<any>(`/favorites?user_id=${userId}`);
    return apiClient.extractList<Favorite>(response.data);
  }

  async addFavorite(data: CreateFavoriteData): Promise<Favorite> {
    const response = await apiClient.post<Favorite>('/favorites', data);
    return response.data;
  }

  async removeFavorite(userId: string, providerId: string): Promise<void> {
    const response = await apiClient.delete<void>(
      `/favorites/${providerId}?user_id=${userId}`,
    );
    return response.data;
  }

  async isFavorite(userId: string, providerId: string): Promise<boolean> {
    try {
      const favorites = await this.getFavorites(userId);
      return favorites.some((fav) => fav.provider_id === providerId);
    } catch (error) {
      return false;
    }
  }
}

export const favoriteService = new FavoriteService();
