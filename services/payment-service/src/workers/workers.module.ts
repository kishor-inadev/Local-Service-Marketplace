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

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'payment.retry' },
      { name: 'payment.refund' },
      { name: 'payment.webhook' },
      { name: 'payment.notification' },
      { name: 'payment.analytics' },
      { name: 'payment.subscription' },
      { name: 'payment.method-expiry' },
      { name: 'payment.cleanup' },
    ),
    NotificationModule,
    UserModule,
    AnalyticsModule,
    PaymentGatewayModule,
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
  ],
})
export class WorkersModule {}
