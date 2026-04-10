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

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'marketplace.notification' },
      { name: 'marketplace.analytics' },
      { name: 'marketplace.rating' },
      { name: 'marketplace.cleanup' },
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
