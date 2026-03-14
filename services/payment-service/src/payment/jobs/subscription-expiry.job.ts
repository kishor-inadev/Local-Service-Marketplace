import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SubscriptionRepository } from '../repositories/subscription.repository';
import { NotificationClient } from '../../common/notification/notification.client';

@Injectable()
export class SubscriptionExpiryJob {
  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly notificationClient: NotificationClient
  ) {}

  /**
   * Run daily at 10 AM to check for expiring subscriptions
   */
  @Cron(CronExpression.EVERY_DAY_AT_10AM)
  async checkExpiringSubscriptions(): Promise<void> {
    console.log('[SubscriptionExpiryJob] Checking for expiring subscriptions...');

    try {
      // Get subscriptions expiring in 7 days
      const expiringSubscriptions = await this.subscriptionRepository.getExpiringSubscriptions(7);

      console.log(`[SubscriptionExpiryJob] Found ${expiringSubscriptions.length} expiring subscriptions`);

      // Send renewal reminders
      for (const subscription of expiringSubscriptions) {
        const daysUntilExpiry = Math.ceil(
          (new Date(subscription.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );

        // Send notification to provider
        await this.notificationClient.sendEmail({
          to: subscription.provider_id,
          template: 'subscriptionExpiring',
          variables: {
            daysUntilExpiry: daysUntilExpiry.toString(),
            subscription_id: subscription.id,
            plan_id: subscription.plan_id,
            expires_at: subscription.expires_at
          }
        });

        console.log(`[SubscriptionExpiryJob] Renewal reminder sent for subscription ${subscription.id}`);
      }

      console.log('[SubscriptionExpiryJob] Completed successfully');
    } catch (error) {
      console.error('[SubscriptionExpiryJob] Error checking expiring subscriptions:', error);
    }
  }

  /**
   * Expire old subscriptions (run daily at 2 AM)
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async expireOldSubscriptions(): Promise<void> {
    console.log('[SubscriptionExpiryJob] Expiring old subscriptions...');

    try {
      const expiredCount = await this.subscriptionRepository.expireOldSubscriptions();

      console.log(`[SubscriptionExpiryJob] Expired ${expiredCount} subscriptions`);

      // Note: Individual notifications are handled in the service layer
      // when subscription status changes

      console.log('[SubscriptionExpiryJob] Expiry process completed');
    } catch (error) {
      console.error('[SubscriptionExpiryJob] Error expiring subscriptions:', error);
    }
  }

  /**
   * Send final reminder 1 day before expiry (run every 6 hours)
   */
  @Cron(CronExpression.EVERY_6_HOURS)
  async sendFinalReminders(): Promise<void> {
    console.log('[SubscriptionExpiryJob] Sending final expiry reminders...');

    try {
      // Get subscriptions expiring in 1 day
      const expiringTomorrow = await this.subscriptionRepository.getExpiringSubscriptions(1);

      console.log(`[SubscriptionExpiryJob] Found ${expiringTomorrow.length} subscriptions expiring tomorrow`);

      for (const subscription of expiringTomorrow) {
        // Send urgent notification
        await this.notificationClient.sendEmail({
          to: subscription.provider_id,
          template: 'subscriptionExpiringUrgent',
          variables: {
            subscription_id: subscription.id,
            plan_id: subscription.plan_id,
            expires_at: subscription.expires_at
          }
        });

        console.log(`[SubscriptionExpiryJob] Final reminder sent for subscription ${subscription.id}`);
      }

      console.log('[SubscriptionExpiryJob] Final reminders completed');
    } catch (error) {
      console.error('[SubscriptionExpiryJob] Error sending final reminders:', error);
    }
  }
}
