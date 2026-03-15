import { useOptimisticMutation } from './useOptimisticMutation';
import { favoriteService } from '@/services/favorite-service';
import { useAuthStore } from '@/store/authStore';

interface ToggleFavoriteVariables {
  providerId: string;
  isFavorite: boolean;
}

/**
 * Hook for optimistic favorite toggle
 * Immediately updates UI, rollback on error
 */
export function useFavoriteToggle() {
  const { user } = useAuthStore();

  return useOptimisticMutation<void, ToggleFavoriteVariables>({
    queryKey: ['favorites', user?.id],
    mutationFn: async ({ providerId, isFavorite }) => {
      if (!user?.id) throw new Error('User not authenticated');

      if (isFavorite) {
        // Remove favorite
        await favoriteService.removeFavorite(user.id, providerId);
      } else {
        // Add favorite
        await favoriteService.addFavorite({
          user_id: user.id,
          provider_id: providerId,
        });
      }
    },
    updateFn: (oldData: any[], { providerId, isFavorite }) => {
      if (!oldData) return [];

      if (isFavorite) {
        // Remove from favorites
        return oldData.filter((fav) => fav.provider_id !== providerId);
      } else {
        // Add to favorites (optimistic entry)
        return [
          ...oldData,
          {
            id: `temp-${providerId}`,
            provider_id: providerId,
            created_at: new Date().toISOString(),
          },
        ];
      }
    },
    successMessage: undefined, // Silent success
    errorMessage: 'Failed to update favorite',
  });
}
