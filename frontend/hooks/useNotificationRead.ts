import { useOptimisticMutation } from './useOptimisticMutation';
import { notificationService, Notification } from '@/services/notification-service';

interface MarkReadVariables {
  notificationId: string;
}

/**
 * Hook for optimistic notification mark as read
 * Immediately updates UI, rollback on error
 */
export function useNotificationRead() {
  return useOptimisticMutation<void, MarkReadVariables>({
    queryKey: ['notifications'],
    mutationFn: async ({ notificationId }) => {
      await notificationService.markAsRead(notificationId);
    },
    updateFn: (oldData: Notification[], { notificationId }) => {
      if (!oldData) return [];

      return oldData.map((notification) =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification,
      );
    },
    successMessage: undefined, // Silent success
    errorMessage: 'Failed to mark notification as read',
  });
}
