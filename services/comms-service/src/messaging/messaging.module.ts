import { Module } from '@nestjs/common';
import { MessagingController } from './messaging.controller';
import { MessageService } from './services/message.service';
import { AttachmentService } from './services/attachment.service';
import { MessageRepository } from './repositories/message.repository';
import { AttachmentRepository } from './repositories/attachment.repository';
import { MessagingGateway } from './gateways/messaging.gateway';

@Module({
  controllers: [MessagingController],
  providers: [
    MessageService,
    AttachmentService,
    MessageRepository,
    AttachmentRepository,
    MessagingGateway,
  ],
  exports: [MessageService, AttachmentService, MessagingGateway],
})
export class MessagingModule {}
