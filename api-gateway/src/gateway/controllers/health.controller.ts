import { Controller, Get, Inject, LoggerService } from "@nestjs/common";
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";
import { GatewayService } from "../services/gateway.service";

/**
 * ServicesHealthController — exposes GET /health/services
 *
 * Checks upstream microservice health by calling each service's /health endpoint.
 * The base GET /health route is handled by common/health/health.controller.ts
 * registered directly in AppModule, which also provides /health/metrics.
 */
@Controller("health")
export class ServicesHealthController {
  constructor(
    private readonly gatewayService: GatewayService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  /**
   * Check all microservices health
   */
  @Get("services")
  async servicesHealthCheck(): Promise<any> {
    this.logger.log("Services health check requested", "ServicesHealthController");

    const servicesHealth = await this.gatewayService.healthCheck();

    const allHealthy = Object.values(servicesHealth).every(
      (service: any) => service.status === "healthy",
    );

    return {
      status: allHealthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      services: servicesHealth,
    };
  }
}
