import { apiClient } from './api-client';

export interface Notification {
  id: string;
  display_id?: string;
  user_id: string;
  type: string;
  message: string;
  read: boolean;
  unsubscribed?: boolean;
  created_at: string;
}

export interface NotificationFilters {
  read?: boolean;
  type?: string;
  cursor?: string;
  limit?: number;
}

class NotificationService {
  async getNotifications(
    filters?: NotificationFilters,
  ): Promise<Notification[]> {
    const params = new URLSearchParams();
    if (filters?.read !== undefined)
      params.append('read', filters.read.toString());
    if (filters?.type) params.append('type', filters.type);
    if (filters?.cursor) params.append('cursor', filters.cursor);
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get<{ notifications: Notification[]; unreadCount: number }>(
      `/notifications?${params.toString()}`,
    );
    const payload: any = response.data;

		if (Array.isArray(payload)) {
			return payload as Notification[];
		}

		if (payload?.notifications && Array.isArray(payload.notifications)) {
			return payload.notifications as Notification[];
		}

		if (payload?.data?.notifications && Array.isArray(payload.data.notifications)) {
			return payload.data.notifications as Notification[];
		}

		if (payload?.data && Array.isArray(payload.data)) {
			return payload.data as Notification[];
		}

		return [];
  }

  async markAsRead(id: string): Promise<void> {
    const response = await apiClient.patch<void>(`/notifications/${id}/read`, {});
    return response.data;
  }

  async markAllAsRead(): Promise<void> {
    const response = await apiClient.patch<void>('/notifications/read-all', {});
    return response.data;
  }

  async getUnreadCount(): Promise<{ count: number }> {
    const response = await apiClient.get<{ count: number }>('/notifications/unread-count');
    return response.data;
  }

  async deleteNotification(id: string): Promise<void> {
    const response = await apiClient.delete<void>(`/notifications/${id}`);
    return response.data;
  }

  // ------------------ Notification Preferences ------------------

  async getNotificationPreferences(): Promise<NotificationPreferences> {
    const response = await apiClient.get<NotificationPreferences>('/notification-preferences');
    return response.data;
  }

  async updateNotificationPreferences(
    preferences: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    const response = await apiClient.put<NotificationPreferences>(
      '/notification-preferences',
      preferences
    );
    return response.data;
  }

  async enableAllNotifications(): Promise<NotificationPreferences> {
    const response = await apiClient.put<NotificationPreferences>(
      '/notification-preferences/enable-all'
    );
    return response.data;
  }

  async disableAllNotifications(): Promise<NotificationPreferences> {
    const response = await apiClient.put<NotificationPreferences>(
      '/notification-preferences/disable-all'
    );
    return response.data;
  }

  // ------------------ Unsubscribe ------------------

  async unsubscribe(email: string, reason?: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(
      '/notifications/unsubscribe',
      { email, reason }
    );
    return response.data;
  }
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  email_notifications: boolean;
  sms_notifications: boolean;
  push_notifications: boolean;
  marketing_emails: boolean;
  new_request_alerts: boolean;
  proposal_alerts: boolean;
  job_updates: boolean;
  payment_alerts: boolean;
  review_alerts: boolean;
  message_alerts: boolean;
  created_at: string;
  updated_at?: string;
}

export const notificationService = new NotificationService();
