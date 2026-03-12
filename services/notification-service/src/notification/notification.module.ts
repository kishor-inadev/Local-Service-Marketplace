import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { NotificationController } from './notification.controller';
import { NotificationService } from './services/notification.service';
import { EmailWorkerService } from './services/email-worker.service';
import { PushWorkerService } from './services/push-worker.service';
import { EventConsumerService } from './services/event-consumer.service';
import { NotificationRepository } from './repositories/notification.repository';
import { NotificationDeliveryRepository } from './repositories/notification-delivery.repository';

@Module({
  imports: [BullModule.registerQueue({ name: 'email-queue' })],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    EmailWorkerService,
    PushWorkerService,
    EventConsumerService,
    NotificationRepository,
    NotificationDeliveryRepository,
  ],
  exports: [NotificationService, EmailWorkerService, PushWorkerService, NotificationRepository, NotificationDeliveryRepository],
})
export class NotificationModule {}
