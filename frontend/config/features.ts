/**
 * Feature Flags Configuration
 * Central place to check if features are enabled based on environment variables
 */

export const featureFlags = {
  // Notification System
  notifications: {
    enabled: process.env.NEXT_PUBLIC_NOTIFICATIONS_ENABLED === 'true',
    email: process.env.NEXT_PUBLIC_EMAIL_ENABLED === 'true',
    sms: process.env.NEXT_PUBLIC_SMS_ENABLED === 'true',
    inApp: process.env.NEXT_PUBLIC_IN_APP_NOTIFICATIONS_ENABLED === 'true',
    push: process.env.NEXT_PUBLIC_PUSH_NOTIFICATIONS_ENABLED === 'true',
  },

  // Messaging/Chat
  messaging: process.env.NEXT_PUBLIC_MESSAGING_ENABLED === 'true',

  // Analytics
  analytics: process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'true',
} as const;

/**
 * Check if any notification feature is enabled
 */
export const isNotificationsEnabled = () => {
  return (
    featureFlags.notifications.enabled ||
    featureFlags.notifications.inApp ||
    featureFlags.notifications.push
  );
};

/**
 * Check if messaging is enabled
 */
export const isMessagingEnabled = () => {
  return featureFlags.messaging;
};

/**
 * Check if analytics is enabled
 */
export const isAnalyticsEnabled = () => {
  return featureFlags.analytics;
};
