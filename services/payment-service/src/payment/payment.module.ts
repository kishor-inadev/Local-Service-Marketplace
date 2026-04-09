import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { BullModule } from "@nestjs/bull";
import { PaymentController } from "./controllers/payment.controller";
import { SavedPaymentMethodController } from "./controllers/saved-payment-method.controller";
import { PricingPlanController } from "./controllers/pricing-plan.controller";
import { SubscriptionController } from "./controllers/subscription.controller";
import { WebhookController } from "./controllers/webhook.controller";
import { PaymentService } from "./services/payment.service";
import { RefundService } from "./services/refund.service";
import { WebhookService } from "./services/webhook.service";
import { CouponService } from "./services/coupon.service";
import { SavedPaymentMethodService } from "./services/saved-payment-method.service";
import { PricingPlanService } from "./services/pricing-plan.service";
import { SubscriptionService } from "./services/subscription.service";
import { InvoiceService } from "./services/invoice.service";
import { PaymentRepository } from "./repositories/payment.repository";
import { RefundRepository } from "./repositories/refund.repository";
import { WebhookRepository } from "./repositories/webhook.repository";
import { CouponRepository } from "./repositories/coupon.repository";
import { SavedPaymentMethodRepository } from "./repositories/saved-payment-method.repository";
import { PricingPlanRepository } from "./repositories/pricing-plan.repository";
import { SubscriptionRepository } from "./repositories/subscription.repository";
import { NotificationModule } from "../common/notification/notification.module";
import { UserModule } from "../common/user/user.module";
import { AnalyticsModule } from "../common/analytics/analytics.module";
import { PaymentGatewayModule } from "./gateway/payment-gateway.module";
import { FileServiceClient } from "../common/file-service.client";

@Module({
  imports: [
    BullModule.registerQueue(
      { name: "payment-queue" },
      { name: "refund-queue" },
    ),
    NotificationModule,
    UserModule,
    AnalyticsModule,
    PaymentGatewayModule,
    HttpModule.register({
      timeout: Number(process.env.REQUEST_TIMEOUT_MS) || 72000,
      maxRedirects: 5,
    }),
  ],
  controllers: [
    PaymentController,
    SavedPaymentMethodController,
    PricingPlanController,
    SubscriptionController,
    WebhookController,
  ],
  providers: [
    PaymentService,
    RefundService,
    WebhookService,
    CouponService,
    SavedPaymentMethodService,
    PricingPlanService,
    SubscriptionService,
    InvoiceService,
    PaymentRepository,
    RefundRepository,
    WebhookRepository,
    CouponRepository,
    SavedPaymentMethodRepository,
    PricingPlanRepository,
    SubscriptionRepository,
    FileServiceClient,
  ],
  exports: [
    PaymentService,
    RefundService,
    WebhookService,
    CouponService,
    SavedPaymentMethodService,
    PricingPlanService,
    SubscriptionService,
    PaymentRepository,
    RefundRepository,
    SavedPaymentMethodRepository,
    PricingPlanRepository,
    SubscriptionRepository,
    PaymentGatewayModule, // re-export so QueueModule can inject PaymentGatewayService
  ],
})
export class PaymentModule {}
