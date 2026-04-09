import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { MessagingController } from "./messaging.controller";
import { MessageService } from "./services/message.service";
import { AttachmentService } from "./services/attachment.service";
import { MessageRepository } from "./repositories/message.repository";
import { AttachmentRepository } from "./repositories/attachment.repository";
import { MessagingGateway } from "./gateways/messaging.gateway";
import { FileServiceClient } from "../common/file-service.client";

@Module({
  imports: [
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
  ],
  controllers: [MessagingController],
  providers: [
    MessageService,
    AttachmentService,
    MessageRepository,
    AttachmentRepository,
    MessagingGateway,
    FileServiceClient,
  ],
  exports: [MessageService, AttachmentService, MessagingGateway, FileServiceClient],
})
export class MessagingModule {}
