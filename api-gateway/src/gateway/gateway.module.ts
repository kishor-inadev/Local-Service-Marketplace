import {
  Module,
  NestModule,
  MiddlewareConsumer,
  RequestMethod,
} from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { GatewayService } from "./services/gateway.service";
import { MaintenanceService } from "./services/maintenance.service";
import { RateLimitConfigService } from "./services/rate-limit-config.service";
import { GatewayController } from "./controllers/gateway.controller";
import { ServicesHealthController } from "./controllers/health.controller";
import { LoggingMiddleware } from "./middlewares/logging.middleware";
import { JwtAuthMiddleware } from "./middlewares/jwt-auth.middleware";
import { RateLimitMiddleware } from "./middlewares/rate-limit.middleware";
import { AuthRateLimitMiddleware } from "./middlewares/auth-rate-limit.middleware";
import { MaintenanceMiddleware } from "./middlewares/maintenance.middleware";

@Module({
  imports: [
    HttpModule.register({
      timeout: Number(process.env.REQUEST_TIMEOUT_MS) || 72000,
      maxRedirects: 5,
    }),
  ],
  controllers: [ServicesHealthController, GatewayController],
  providers: [GatewayService, MaintenanceService, RateLimitConfigService],
  exports: [GatewayService, MaintenanceService, RateLimitConfigService],
})
export class GatewayModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Maintenance check runs first — before auth or rate limiting
    consumer.apply(MaintenanceMiddleware).forRoutes("*");

    // Apply logging middleware to all routes
    consumer.apply(LoggingMiddleware).forRoutes("*");

    // Apply JWT authentication middleware to all routes
    // Public routes are defined in publicRoutes (services.config.ts)
    consumer.apply(JwtAuthMiddleware).forRoutes("*");

    // Apply rate limiting middleware to all routes
    consumer.apply(RateLimitMiddleware).forRoutes("*");

    // Apply stricter rate limiting to authentication endpoints (10 req/15 min per IP).
    // Paths must include the /api/v1 prefix that controllers add, otherwise the
    // middleware path-matching never fires.
    consumer
      .apply(AuthRateLimitMiddleware)
      .forRoutes(
        { path: "/api/v1/user/auth/login", method: RequestMethod.POST },
        { path: "/api/v1/user/auth/register", method: RequestMethod.POST },
        { path: "/api/v1/user/auth/refresh", method: RequestMethod.POST },
        { path: "/api/v1/user/auth/forgot-password", method: RequestMethod.POST },
        { path: "/api/v1/user/auth/reset-password", method: RequestMethod.POST },
        { path: "/api/v1/user/auth/verify-otp", method: RequestMethod.POST },
        { path: "/api/v1/user/auth/send-otp", method: RequestMethod.POST },
      );
  }
}
