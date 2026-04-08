import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bull";
import { NotificationController } from "./notification.controller";
import { NotificationPreferencesController } from "./controllers/notification-preferences.controller";
import { NotificationService } from "./services/notification.service";
import { EmailWorkerService } from "./services/email-worker.service";
import { PushWorkerService } from "./services/push-worker.service";
import { EventConsumerService } from "./services/event-consumer.service";
import { NotificationPreferencesService } from "./services/notification-preferences.service";
import { FeatureFlagService } from "./services/feature-flag.service";
import { NotificationRepository } from "./repositories/notification.repository";
import { NotificationDeliveryRepository } from "./repositories/notification-delivery.repository";
import { UnsubscribeRepository } from "./repositories/unsubscribe.repository";
import { NotificationPreferencesRepository } from "./repositories/notification-preferences.repository";
import { EmailClient } from "./clients/email.client";
import { SmsClient } from "./clients/sms.client";

@Module({
  imports: [BullModule.registerQueue({ name: "email-queue" })],
  controllers: [NotificationController, NotificationPreferencesController],
  providers: [
    NotificationService,
    EmailWorkerService,
    PushWorkerService,
    EventConsumerService,
    NotificationPreferencesService,
    FeatureFlagService,
    NotificationRepository,
    NotificationDeliveryRepository,
    UnsubscribeRepository,
    NotificationPreferencesRepository,
    EmailClient,
    SmsClient,
  ],
  exports: [
    NotificationService,
    EmailWorkerService,
    PushWorkerService,
    NotificationPreferencesService,
    FeatureFlagService,
    NotificationRepository,
    NotificationDeliveryRepository,
    UnsubscribeRepository,
    NotificationPreferencesRepository,
    EmailClient,
    SmsClient,
  ],
})
export class NotificationModule {}
