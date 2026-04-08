import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bull";
import { EmailQueueProcessor } from "./processors/email-queue.processor";
import { NotificationModule } from "../notification/notification.module";

@Module({
  imports: [
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || "redis",
        port: parseInt(process.env.REDIS_PORT) || 6379,
      },
    }),
    BullModule.registerQueue({
      name: "email-queue",
    }),
    NotificationModule,
  ],
  providers: [EmailQueueProcessor],
  exports: [BullModule],
})
export class QueueModule {}
