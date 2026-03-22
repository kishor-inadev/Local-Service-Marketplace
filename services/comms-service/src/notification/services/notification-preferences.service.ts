import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationPreferencesRepository } from '../repositories/notification-preferences.repository';
import { UpdateNotificationPreferencesDto } from '../dto/update-notification-preferences.dto';
import { NotificationPreferences } from '../entities/notification-preferences.entity';

@Injectable()
export class NotificationPreferencesService {
  constructor(
    private readonly preferencesRepository: NotificationPreferencesRepository
  ) {}

  async createDefaultPreferences(userId: string): Promise<NotificationPreferences> {
    // Create default notification preferences when user signs up
    // Most notifications enabled by default, except marketing
    return this.preferencesRepository.create(userId);
  }

  async getPreferences(userId: string): Promise<NotificationPreferences> {
    let preferences = await this.preferencesRepository.findByUserId(userId);

    // If preferences don't exist, create default ones
    if (!preferences) {
      preferences = await this.createDefaultPreferences(userId);
    }

    return preferences;
  }

  async updatePreferences(
    userId: string,
    dto: UpdateNotificationPreferencesDto
  ): Promise<NotificationPreferences> {
    const preferences = await this.getPreferences(userId);

    return this.preferencesRepository.update(preferences.id, dto);
  }

  async checkNotificationEnabled(
    userId: string,
    notificationType: keyof UpdateNotificationPreferencesDto
  ): Promise<boolean> {
    const preferences = await this.getPreferences(userId);
    return preferences[notificationType] ?? true; // Default to true if not set
  }

  async getUsersForNotification(
    notificationType: keyof UpdateNotificationPreferencesDto
  ): Promise<NotificationPreferences[]> {
    // Get all users who have this notification type enabled
    // Used for bulk notifications
    return this.preferencesRepository.getUsersWithPreference(
      notificationType as string,
      true
    );
  }

  async disableAllNotifications(userId: string): Promise<NotificationPreferences> {
    const preferences = await this.getPreferences(userId);

    return this.preferencesRepository.update(preferences.id, {
      email_notifications: false,
      sms_notifications: false,
      push_notifications: false,
      marketing_emails: false,
      new_request_alerts: false,
      proposal_alerts: false,
      job_updates: false,
      payment_alerts: false,
      review_alerts: false,
      message_alerts: false
    });
  }

  async enableAllNotifications(userId: string): Promise<NotificationPreferences> {
    const preferences = await this.getPreferences(userId);

    return this.preferencesRepository.update(preferences.id, {
      email_notifications: true,
      sms_notifications: true,
      push_notifications: true,
      marketing_emails: true,
      new_request_alerts: true,
      proposal_alerts: true,
      job_updates: true,
      payment_alerts: true,
      review_alerts: true,
      message_alerts: true
    });
  }
}
