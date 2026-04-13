import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { MessagingController } from "./messaging.controller";
import { MessageService } from "./services/message.service";
import { AttachmentService } from "./services/attachment.service";
import { MessageRepository } from "./repositories/message.repository";
import { AttachmentRepository } from "./repositories/attachment.repository";
import { MessagingGateway } from "./gateways/messaging.gateway";
import { FileServiceClient } from "../common/file-service.client";
import { NotificationModule } from "../notification/notification.module";
import { UserModule } from "../common/user/user.module";

@Module({
  imports: [
    HttpModule.register({
      timeout: Number(process.env.REQUEST_TIMEOUT_MS) || 72000,
      maxRedirects: 5,
    }),
    NotificationModule,
    UserModule,
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
