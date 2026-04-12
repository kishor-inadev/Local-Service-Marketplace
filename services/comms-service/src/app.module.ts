import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";
import { NotificationModule } from "./notification/notification.module";
import { MessagingModule } from "./messaging/messaging.module";
import { DatabaseModule } from "./common/database/database.module";
import { LoggerModule } from "./common/logger/logger.module";
import { KafkaModule } from "./kafka/kafka.module";
import { BullMQCoreModule } from "./bullmq/bullmq.module";
import { QueueModule } from "./queue/queue.module";
import { HealthController } from "./common/health/health.controller";

// WorkersModule only loaded in worker pods (WORKERS_ENABLED=true)
import { WorkersModule } from "./workers/workers.module";
const workerModules = process.env.WORKERS_ENABLED === 'true' ? [WorkersModule] : [];

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ".env" }),
    ThrottlerModule.forRoot([
      { name: "email", ttl: 60000, limit: 10 },
      { name: "sms", ttl: 3600000, limit: 5 },
    ]),
    LoggerModule,
    DatabaseModule,
    BullMQCoreModule,
    QueueModule,
    KafkaModule.register(),
    NotificationModule,
    MessagingModule,
    ...workerModules,
  ],
  controllers: [HealthController],
})
export class AppModule {}
