import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { LoggerModule } from "./common/logger/logger.module";
import { GatewayModule } from "./gateway/gateway.module";
import { HealthController } from "./common/health/health.controller";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Make ConfigService available globally
      envFilePath: ".env",
    }),
    LoggerModule,
    GatewayModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
