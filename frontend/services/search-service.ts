import { apiClient } from './api-client';

// Helper: Safely extract list from various response shapes
function extractList<T>(payload: any): T[] {
	if (Array.isArray(payload)) return payload as T[];
	if (payload && Array.isArray(payload.data)) return payload.data as T[];
	return [];
}

export interface SearchResult {
  id: string;
  name: string;
  description?: string;
  type: 'provider' | 'category' | 'location';
}

export interface ProviderSearchResult {
  id: string;
  business_name: string;
  description: string;
  rating: number;
}

export interface CategorySearchResult {
  id: string;
  name: string;
  description: string;
}

class SearchService {
  /**
   * Search providers by name or description
   */
  async searchProviders(query: string, limit: number = 5): Promise<ProviderSearchResult[]> {
    if (!query || query.length < 2) return [];

    const response = await apiClient.get<any>(
      `/providers?search=${encodeURIComponent(query)}&limit=${limit}`,
    );

    // Handle plain array or paginated { data: [...] } response
    const data = response.data;
    return extractList<ProviderSearchResult>(data);
  }

  /**
   * Search categories by name
   */
  async searchCategories(query: string, limit: number = 5): Promise<CategorySearchResult[]> {
    if (!query || query.length < 2) return [];

    const response = await apiClient.get<any>(
      `/categories?search=${encodeURIComponent(query)}&limit=${limit}`,
    );
    return extractList<CategorySearchResult>(response.data);
  }

  /**
   * Combined search across providers and categories
   */
  async searchAll(query: string, limit: number = 10): Promise<SearchResult[]> {
    if (!query || query.length < 2) return [];

    const [providers, categories] = await Promise.all([
      this.searchProviders(query, Math.ceil(limit / 2)),
      this.searchCategories(query, Math.ceil(limit / 2)),
    ]);

    const results: SearchResult[] = [
      ...providers.map((provider) => ({
        id: provider.id,
        name: provider.business_name,
        description: provider.description,
        type: 'provider' as const,
      })),
      ...categories.map((category) => ({
        id: category.id,
        name: category.name,
        description: category.description,
        type: 'category' as const,
      })),
    ];

    return results.slice(0, limit);
  }
}

export const searchService = new SearchService();
