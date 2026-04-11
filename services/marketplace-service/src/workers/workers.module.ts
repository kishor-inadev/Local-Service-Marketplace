import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MarketplaceNotificationWorker } from './notification.worker';
import { ProviderRatingWorker } from './provider-rating.worker';
import { MarketplaceAnalyticsWorker } from './analytics.worker';
import { MarketplaceCleanupWorker } from './cleanup.worker';
import { NotificationModule } from '../common/notification/notification.module';
import { UserModule } from '../common/user/user.module';
import { AnalyticsModule } from '../common/analytics/analytics.module';
import { ProviderReviewAggregateRepository } from '../modules/review/repositories/provider-review-aggregate.repository';
import { RequestRepository } from '../modules/request/repositories/request.repository';
import { getQueueRegistrationOptions } from '../config/queue-config';

/**
 * Marketplace Workers Module
 * 
 * Queue Configuration:
 *   - marketplace.notification: 10s timeout, NORMAL priority, 3 attempts
 *   - marketplace.analytics:    60s timeout, NORMAL priority, 2 attempts
 *   - marketplace.rating:       60s timeout, NORMAL priority, 2 attempts
 *   - marketplace.cleanup:      120s timeout, LOW priority,   2 attempts
 */
@Module({
  imports: [
    BullModule.registerQueue(
      getQueueRegistrationOptions('marketplace.notification'),
      getQueueRegistrationOptions('marketplace.analytics'),
      getQueueRegistrationOptions('marketplace.rating'),
      getQueueRegistrationOptions('marketplace.cleanup'),
    ),
    NotificationModule,
    UserModule,
    AnalyticsModule,
  ],
  providers: [
    MarketplaceNotificationWorker,
    ProviderRatingWorker,
    MarketplaceAnalyticsWorker,
    MarketplaceCleanupWorker,
    ProviderReviewAggregateRepository,
    RequestRepository,
  ],
})
export class WorkersModule {}
