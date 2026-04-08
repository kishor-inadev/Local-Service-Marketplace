import {
  Module,
  NestModule,
  MiddlewareConsumer,
  RequestMethod,
} from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { GatewayService } from "./services/gateway.service";
import { GatewayController } from "./controllers/gateway.controller";
import { HealthController } from "./controllers/health.controller";
import { LoggingMiddleware } from "./middlewares/logging.middleware";
import { JwtAuthMiddleware } from "./middlewares/jwt-auth.middleware";
import { RateLimitMiddleware } from "./middlewares/rate-limit.middleware";
import { AuthRateLimitMiddleware } from "./middlewares/auth-rate-limit.middleware";

@Module({
  imports: [
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
  ],
  controllers: [HealthController, GatewayController],
  providers: [GatewayService],
  exports: [GatewayService],
})
export class GatewayModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply logging middleware to all routes
    consumer.apply(LoggingMiddleware).forRoutes("*");

    // Apply JWT authentication middleware to all routes
    // Public routes are defined in publicRoutes (services.config.ts)
    consumer.apply(JwtAuthMiddleware).forRoutes("*");

    // Apply rate limiting middleware to all routes
    consumer.apply(RateLimitMiddleware).forRoutes("*");

    // Apply stricter rate limiting to authentication endpoints (10 req/15 min per IP)
    consumer
      .apply(AuthRateLimitMiddleware)
      .forRoutes(
        { path: "/user/auth/login", method: RequestMethod.POST },
        { path: "/user/auth/register", method: RequestMethod.POST },
        { path: "/user/auth/refresh", method: RequestMethod.POST },
        { path: "/user/auth/forgot-password", method: RequestMethod.POST },
        { path: "/user/auth/reset-password", method: RequestMethod.POST },
        { path: "/user/auth/verify-otp", method: RequestMethod.POST },
        { path: "/user/auth/send-otp", method: RequestMethod.POST },
      );
  }
}
