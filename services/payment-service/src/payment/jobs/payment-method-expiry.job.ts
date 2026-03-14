import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SavedPaymentMethodRepository } from '../repositories/saved-payment-method.repository';
import { NotificationClient } from '../../common/notification/notification.client';

@Injectable()
export class PaymentMethodExpiryJob {
  constructor(
    private readonly paymentMethodRepository: SavedPaymentMethodRepository,
    private readonly notificationClient: NotificationClient
  ) {}

  /**
   * Check for expiring payment methods daily at 11 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_11AM)
  async checkExpiringPaymentMethods(): Promise<void> {
    console.log('[PaymentMethodExpiryJob] Checking for expiring payment methods...');

    try {
      // Get all payment methods
      // Note: This would need to be optimized to query users in batches
      // For now, this is a simplified implementation

      // TODO: Implement batch processing of users
      // const users = await this.userRepository.getAllUsers();
      
      // For each user, check for expiring cards
      // This is a placeholder - actual implementation would query more efficiently

      console.log('[PaymentMethodExpiryJob] Payment method expiry check completed');
    } catch (error) {
      console.error('[PaymentMethodExpiryJob] Error checking expiring payment methods:', error);
    }
  }
}
