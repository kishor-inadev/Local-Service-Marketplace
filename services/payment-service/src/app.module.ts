import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { LoggerModule } from "./common/logger/logger.module";
import { DatabaseModule } from "./common/database/database.module";
import { QueueModule } from "./queue/queue.module";
import { KafkaModule } from "./kafka/kafka.module";
import { NotificationModule } from "./common/notification/notification.module";
import { UserModule } from "./common/user/user.module";
import { PaymentModule } from "./payment/payment.module";
import { HealthController } from "./common/health/health.controller";
import { AnalyticsModule } from "./common/analytics/analytics.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    LoggerModule,
    DatabaseModule,
    QueueModule,
    KafkaModule,
    NotificationModule,
    UserModule,
    PaymentModule,
    AnalyticsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
