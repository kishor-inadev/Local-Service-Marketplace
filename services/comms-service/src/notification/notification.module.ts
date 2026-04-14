import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { NotificationController } from "./notification.controller";
import { NotificationPreferencesController } from "./controllers/notification-preferences.controller";
import { DeviceController } from "./controllers/device.controller";
import { NotificationService } from "./services/notification.service";
import { PushNotificationService } from "./services/push-notification.service";
import { EmailWorkerService } from "./services/email-worker.service";
import { PushWorkerService } from "./services/push-worker.service";
import { EventConsumerService } from "./services/event-consumer.service";
import { NotificationPreferencesService } from "./services/notification-preferences.service";
import { FeatureFlagService } from "./services/feature-flag.service";
import { NotificationRepository } from "./repositories/notification.repository";
import { NotificationDeliveryRepository } from "./repositories/notification-delivery.repository";
import { UnsubscribeRepository } from "./repositories/unsubscribe.repository";
import { NotificationPreferencesRepository } from "./repositories/notification-preferences.repository";
import { DeviceRepository } from "./repositories/device.repository";
import { EmailClient } from "./clients/email.client";
import { SmsClient } from "./clients/sms.client";
import { WhatsAppClient } from "./clients/whatsapp.client";
import { UserClient } from "../common/user/user.client";

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'comms.email' },
      { name: 'comms.sms' },
      { name: 'comms.push' },
      { name: 'comms.whatsapp' },
    ),
  ],
  controllers: [NotificationController, NotificationPreferencesController, DeviceController],
  providers: [
    NotificationService,
    PushNotificationService,
    EmailWorkerService,
    PushWorkerService,
    EventConsumerService,
    NotificationPreferencesService,
    FeatureFlagService,
    NotificationRepository,
    NotificationDeliveryRepository,
    UnsubscribeRepository,
    NotificationPreferencesRepository,
    DeviceRepository,
    EmailClient,
    SmsClient,
    WhatsAppClient,
    UserClient,
  ],
  exports: [
    NotificationService,
    PushNotificationService,
    EmailWorkerService,
    PushWorkerService,
    NotificationPreferencesService,
    FeatureFlagService,
    NotificationRepository,
    NotificationDeliveryRepository,
    UnsubscribeRepository,
    NotificationPreferencesRepository,
    DeviceRepository,
    EmailClient,
    SmsClient,
    WhatsAppClient,
  ],
})
export class NotificationModule {}
