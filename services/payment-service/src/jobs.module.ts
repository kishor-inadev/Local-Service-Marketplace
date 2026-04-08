import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { SubscriptionExpiryJob } from "./payment/jobs/subscription-expiry.job";
import { PaymentMethodExpiryJob } from "./payment/jobs/payment-method-expiry.job";
import { SubscriptionRepository } from "./payment/repositories/subscription.repository";
import { SavedPaymentMethodRepository } from "./payment/repositories/saved-payment-method.repository";
import { NotificationModule } from "./common/notification/notification.module";

@Module({
  imports: [ScheduleModule.forRoot(), NotificationModule],
  providers: [
    SubscriptionExpiryJob,
    PaymentMethodExpiryJob,
    SubscriptionRepository,
    SavedPaymentMethodRepository,
  ],
  exports: [SubscriptionExpiryJob, PaymentMethodExpiryJob],
})
export class JobsModule {}
