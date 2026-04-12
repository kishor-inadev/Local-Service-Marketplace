import { apiClient } from './api-client';

export interface Favorite {
  id: string;
  provider_id: string;
  provider_name: string;
  provider_description: string;
  provider_rating: number;
  created_at: string;
}

class FavoriteService {
  async getFavorites(): Promise<Favorite[]> {
    const response = await apiClient.get<any>(`/favorites`);
    return apiClient.extractList<Favorite>(response.data);
  }

  async addFavorite(providerId: string): Promise<Favorite> {
    const response = await apiClient.post<Favorite>('/favorites', { provider_id: providerId });
    return response.data;
  }

  async removeFavorite(providerId: string): Promise<void> {
    const response = await apiClient.delete<void>(`/favorites/${providerId}`);
    return response.data;
  }

  async isFavorite(providerId: string): Promise<boolean> {
    try {
      const favorites = await this.getFavorites();
      return favorites.some((fav) => fav.provider_id === providerId);
    } catch (error) {
      return false;
    }
  }
}

export const favoriteService = new FavoriteService();
