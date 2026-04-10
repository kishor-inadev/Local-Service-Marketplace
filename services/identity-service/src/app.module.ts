import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./modules/auth/auth.module";
import { UserModule } from "./modules/user/user.module";
import { DatabaseModule } from "./common/database/database.module";
import { LoggerModule } from "./common/logger/logger.module";
import { RedisModule } from "./redis/redis.module";
import { NotificationModule } from "./common/notification/notification.module";
import { HealthController } from "./common/health/health.controller";
import { BullMQCoreModule } from "./bullmq/bullmq.module";
import { WorkersModule } from "./workers/workers.module";

const conditionalModules = process.env.WORKERS_ENABLED === "true" ? [WorkersModule] : [];

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ".env" }),
    LoggerModule,
    DatabaseModule,
    BullMQCoreModule,
    RedisModule,
    NotificationModule,
    AuthModule,
    UserModule,
    ...conditionalModules,
  ],
  controllers: [HealthController],
})
export class AppModule {}
