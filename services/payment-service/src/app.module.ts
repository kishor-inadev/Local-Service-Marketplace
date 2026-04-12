import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { LoggerModule } from "./common/logger/logger.module";
import { DatabaseModule } from "./common/database/database.module";
import { QueueModule } from "./queue/queue.module";
import { BullMQCoreModule } from "./bullmq/bullmq.module";
import { WorkersModule } from "./workers/workers.module";
import { KafkaModule } from "./kafka/kafka.module";
import { NotificationModule } from "./common/notification/notification.module";
import { UserModule } from "./common/user/user.module";
import { MarketplaceModule } from "./common/marketplace/marketplace.module";
import { PaymentModule } from "./payment/payment.module";
import { HealthController } from "./common/health/health.controller";
import { AnalyticsModule } from "./common/analytics/analytics.module";

const conditionalModules = process.env.WORKERS_ENABLED === "true" ? [WorkersModule] : [];

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    LoggerModule,
    DatabaseModule,
    BullMQCoreModule,
    QueueModule,
    ...conditionalModules,
    KafkaModule.register(),
    NotificationModule,
    UserModule,
    MarketplaceModule,
    PaymentModule,
    AnalyticsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
