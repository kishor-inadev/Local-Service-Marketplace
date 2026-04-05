import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";

interface RouteMetric {
	count: number;
	errors: number;
	totalMs: number;
}

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
	private static metrics: Map<string, RouteMetric> = new Map();
	private static totalRequests = 0;
	private static totalErrors = 0;
	private static startTime = Date.now();

	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		const req = context.switchToHttp().getRequest();
		const method = req.method;
		const path = req.route?.path || req.url?.split("?")[0] || "unknown";
		const key = `${method} ${path}`;
		const start = Date.now();

		MetricsInterceptor.totalRequests++;

		return next.handle().pipe(
			tap({
				next: () => {
					const duration = Date.now() - start;
					this.record(key, duration, false);
				},
				error: () => {
					const duration = Date.now() - start;
					this.record(key, duration, true);
					MetricsInterceptor.totalErrors++;
				},
			}),
		);
	}

	private record(key: string, durationMs: number, isError: boolean): void {
		const existing = MetricsInterceptor.metrics.get(key) || { count: 0, errors: 0, totalMs: 0 };
		existing.count++;
		existing.totalMs += durationMs;
		if (isError) existing.errors++;
		MetricsInterceptor.metrics.set(key, existing);
	}

	static getMetrics() {
		const routes: Record<string, { count: number; errors: number; avgMs: number }> = {};
		for (const [key, metric] of MetricsInterceptor.metrics.entries()) {
			routes[key] = {
				count: metric.count,
				errors: metric.errors,
				avgMs: metric.count > 0 ? Math.round(metric.totalMs / metric.count) : 0,
			};
		}
		return {
			totalRequests: MetricsInterceptor.totalRequests,
			totalErrors: MetricsInterceptor.totalErrors,
			uptimeSeconds: Math.round((Date.now() - MetricsInterceptor.startTime) / 1000),
			memoryUsageMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
			routes,
		};
	}

	/** Prometheus text exposition format */
	static toPrometheus(): string {
		const lines: string[] = [];
		const m = MetricsInterceptor;

		lines.push("# HELP http_requests_total Total HTTP requests");
		lines.push("# TYPE http_requests_total counter");
		lines.push(`http_requests_total ${m.totalRequests}`);

		lines.push("# HELP http_errors_total Total HTTP errors");
		lines.push("# TYPE http_errors_total counter");
		lines.push(`http_errors_total ${m.totalErrors}`);

		lines.push("# HELP process_uptime_seconds Process uptime in seconds");
		lines.push("# TYPE process_uptime_seconds gauge");
		lines.push(`process_uptime_seconds ${Math.round((Date.now() - m.startTime) / 1000)}`);

		lines.push("# HELP process_heap_bytes Process heap memory usage");
		lines.push("# TYPE process_heap_bytes gauge");
		lines.push(`process_heap_bytes ${process.memoryUsage().heapUsed}`);

		lines.push("# HELP http_request_duration_ms_avg Average request duration per route");
		lines.push("# TYPE http_request_duration_ms_avg gauge");
		for (const [key, metric] of m.metrics.entries()) {
			const label = key.replace(/"/g, '\\"');
			const avg = metric.count > 0 ? Math.round(metric.totalMs / metric.count) : 0;
			lines.push(`http_request_duration_ms_avg{route="${label}"} ${avg}`);
			lines.push(`http_requests_total{route="${label}"} ${metric.count}`);
			lines.push(`http_errors_total{route="${label}"} ${metric.errors}`);
		}

		return lines.join("\n") + "\n";
	}
}
