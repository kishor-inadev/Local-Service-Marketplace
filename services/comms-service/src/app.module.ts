import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";
import { NotificationModule } from "./notification/notification.module";
import { MessagingModule } from "./messaging/messaging.module";
import { DatabaseModule } from "./common/database/database.module";
import { LoggerModule } from "./common/logger/logger.module";
import { KafkaModule } from "./kafka/kafka.module";
import { QueueModule } from "./queue/queue.module";
import { HealthController } from "./common/health/health.controller";

@Module({
	imports: [
		ConfigModule.forRoot({ isGlobal: true, envFilePath: ".env" }),
		ThrottlerModule.forRoot([
			{ name: "email", ttl: 60000, limit: 10 },
			{ name: "sms", ttl: 3600000, limit: 5 },
		]),
		LoggerModule,
		DatabaseModule,
		QueueModule,
		KafkaModule,
		NotificationModule,
		MessagingModule,
	],
	controllers: [HealthController],
})
export class AppModule {}
