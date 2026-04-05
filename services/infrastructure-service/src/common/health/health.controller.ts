import { Controller, Get, Inject } from "@nestjs/common";
import { Pool } from "pg";

@Controller("health")
export class HealthController {
	constructor(@Inject("DATABASE_POOL") private readonly pool: Pool) {}

	@Get()
	async check() {
		const health: any = {
			status: "ok",
			service: "infrastructure-service",
			timestamp: new Date().toISOString(),
			uptime: process.uptime(),
		};

		try {
			const start = Date.now();
			await this.pool.query("SELECT 1");
			health.database = { status: "ok", responseTime: `${Date.now() - start}ms` };
		} catch (error) {
			health.status = "degraded";
			health.database = { status: "error", message: error.message };
		}

		return health;
	}
}
