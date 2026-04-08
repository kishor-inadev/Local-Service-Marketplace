import { Controller, Get, Inject, LoggerService } from "@nestjs/common";
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";
import { GatewayService } from "../services/gateway.service";

@Controller("health")
export class HealthController {
  constructor(
    private readonly gatewayService: GatewayService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  /**
   * Gateway health check
   */
  @Get()
  async healthCheck(): Promise<any> {
    this.logger.log("Health check requested", "HealthController");

    return {
      status: "healthy",
      timestamp: new Date().toISOString(),
      gateway: "api-gateway",
      uptime: process.uptime(),
    };
  }

  /**
   * Check all microservices health
   */
  @Get("services")
  async servicesHealthCheck(): Promise<any> {
    this.logger.log("Services health check requested", "HealthController");

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
