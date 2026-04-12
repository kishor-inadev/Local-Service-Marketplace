import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PaymentWorker } from './payment.worker';
import { RefundWorker } from './refund.worker';
import { WebhookWorker } from './webhook.worker';
import { PaymentNotificationWorker } from './notification.worker';
import { PaymentAnalyticsWorker } from './analytics.worker';
import { SubscriptionWorker } from './subscription.worker';
import { MethodExpiryWorker } from './method-expiry.worker';
import { PaymentCleanupWorker } from './cleanup.worker';
import { PaymentModule } from '../payment/payment.module';
import { NotificationModule } from '../common/notification/notification.module';
import { UserModule } from '../common/user/user.module';
import { AnalyticsModule } from '../common/analytics/analytics.module';
import { WebhookRepository } from '../payment/repositories/webhook.repository';
import { CouponRepository } from '../payment/repositories/coupon.repository';
import { SubscriptionRepository } from '../payment/repositories/subscription.repository';
import { SavedPaymentMethodRepository } from '../payment/repositories/saved-payment-method.repository';
import { PaymentRepository } from '../payment/repositories/payment.repository';
import { RefundRepository } from '../payment/repositories/refund.repository';
import { PaymentGatewayModule } from '../payment/gateway/payment-gateway.module';
import { DeadLetterQueueService } from '../common/dlq/dead-letter-queue.service';
import { DatabaseModule } from '../common/database/database.module';
import { KafkaModule } from '../kafka/kafka.module';
import { getQueueRegistrationOptions } from '../config/queue-config';

/**
 * Payment Workers Module
 * 
 * Queue Configuration:
 *   - payment.retry:        30s timeout, CRITICAL priority, 5 attempts
 *   - payment.refund:       30s timeout, CRITICAL priority, 3 attempts
 *   - payment.webhook:      20s timeout, HIGH priority,     5 attempts
 *   - payment.notification: 10s timeout, HIGH priority,     3 attempts
 *   - payment.analytics:    60s timeout, NORMAL priority,   2 attempts
 *   - payment.subscription: 30s timeout, HIGH priority,     3 attempts
 *   - payment.method-expiry:60s timeout, LOW priority,      2 attempts
 *   - payment.cleanup:      120s timeout, LOW priority,     2 attempts
 */
@Module({
  imports: [
    BullModule.registerQueue(
      getQueueRegistrationOptions('payment.retry'),
      getQueueRegistrationOptions('payment.refund'),
      getQueueRegistrationOptions('payment.webhook'),
      getQueueRegistrationOptions('payment.notification'),
      getQueueRegistrationOptions('payment.analytics'),
      getQueueRegistrationOptions('payment.subscription'),
      getQueueRegistrationOptions('payment.method-expiry'),
      getQueueRegistrationOptions('payment.cleanup'),
    ),
    NotificationModule,
    UserModule,
    AnalyticsModule,
    PaymentGatewayModule,
    DatabaseModule,
    KafkaModule,
  ],
  providers: [
    PaymentWorker,
    RefundWorker,
    WebhookWorker,
    PaymentNotificationWorker,
    PaymentAnalyticsWorker,
    SubscriptionWorker,
    MethodExpiryWorker,
    PaymentCleanupWorker,
    // Repositories needed by workers
    PaymentRepository,
    RefundRepository,
    WebhookRepository,
    CouponRepository,
    SubscriptionRepository,
    SavedPaymentMethodRepository,
    // DLQ service for failed job capture
    DeadLetterQueueService,
  ],
})
export class WorkersModule {}
