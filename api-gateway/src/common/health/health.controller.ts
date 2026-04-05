import { Controller, Get, Header } from "@nestjs/common";
import { MetricsInterceptor } from "../interceptors/metrics.interceptor";

@Controller("health")
export class HealthController {
	@Get()
	check() {
		return { status: "ok", service: "api-gateway", timestamp: new Date().toISOString(), uptime: process.uptime() };
	}

	@Get("metrics")
	getMetrics() {
		return MetricsInterceptor.getMetrics();
	}

	@Get("metrics/prometheus")
	@Header("Content-Type", "text/plain; version=0.0.4")
	getPrometheusMetrics(): string {
		return MetricsInterceptor.toPrometheus();
	}
}
