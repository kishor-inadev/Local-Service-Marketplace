import { Injectable } from '@nestjs/common';

@Injectable()
export class FeatureFlagService {
  // Notification Channel Flags
  readonly emailEnabled: boolean;
  readonly smsEnabled: boolean;
  
  // Feature Flags - MVP Disabled Features
  readonly inAppNotificationsEnabled: boolean;
  readonly pushNotificationsEnabled: boolean;
  readonly notificationPreferencesEnabled: boolean;
  readonly deviceTrackingEnabled: boolean;

  constructor() {
    // Notification Channels
    this.emailEnabled = process.env.EMAIL_ENABLED !== 'false';
    this.smsEnabled = process.env.SMS_ENABLED === 'true';
    
    // Advanced Features (Disabled for MVP by default)
    this.inAppNotificationsEnabled = process.env.IN_APP_NOTIFICATIONS_ENABLED === 'true';
    this.pushNotificationsEnabled = process.env.PUSH_NOTIFICATIONS_ENABLED === 'true';
    this.notificationPreferencesEnabled = process.env.NOTIFICATION_PREFERENCES_ENABLED === 'true';
    this.deviceTrackingEnabled = process.env.DEVICE_TRACKING_ENABLED === 'true';
  }

  isFeatureEnabled(feature: string): boolean {
    switch (feature) {
      case 'email':
        return this.emailEnabled;
      case 'sms':
        return this.smsEnabled;
      case 'in_app':
        return this.inAppNotificationsEnabled;
      case 'push':
        return this.pushNotificationsEnabled;
      case 'preferences':
        return this.notificationPreferencesEnabled;
      case 'device_tracking':
        return this.deviceTrackingEnabled;
      default:
        return false;
    }
  }

  getEnabledChannels(): string[] {
    const channels: string[] = [];
    if (this.emailEnabled) channels.push('email');
    if (this.smsEnabled) channels.push('sms');
    if (this.pushNotificationsEnabled) channels.push('push');
    if (this.inAppNotificationsEnabled) channels.push('in_app');
    return channels;
  }

  checkFeatureOrThrow(feature: string, featureName: string): void {
    if (!this.isFeatureEnabled(feature)) {
      throw new Error(`${featureName} is disabled. Set ${feature.toUpperCase()}_ENABLED=true to enable this feature.`);
    }
  }
}
