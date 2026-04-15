import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

/**
 * Polls oversight-service /public/rate-limit-config every 60 seconds
 * and caches the result in memory so rate-limit middlewares can read it
 * without making a DB call on every request.
 */
@Injectable()
export class RateLimitConfigService implements OnModuleInit, OnModuleDestroy {
private config = {
rate_limit_max_requests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '500', 10),
auth_rate_limit_max_requests: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '10', 10),
rate_limit_window_ms: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
};
private timer: NodeJS.Timeout | null = null;

private readonly POLL_INTERVAL_MS = 60_000;
private readonly oversightUrl: string;

constructor(
private readonly configService: ConfigService,
private readonly httpService: HttpService,
) {
this.oversightUrl =
this.configService.get<string>('OVERSIGHT_SERVICE_URL') ||
this.configService.get<string>('ADMIN_SERVICE_URL') ||
'http://localhost:3010';
}

async onModuleInit() {
await this.poll();
this.timer = setInterval(() => this.poll(), this.POLL_INTERVAL_MS);
}

onModuleDestroy() {
if (this.timer) clearInterval(this.timer);
}

private async poll(): Promise<void> {
try {
const response = await firstValueFrom(
this.httpService.get(`${this.oversightUrl}/public/rate-limit-config`, {
timeout: 5000,
}),
);
const data = response.data?.data ?? response.data;
if (data) {
this.config = {
rate_limit_max_requests: data.rate_limit_max_requests ?? this.config.rate_limit_max_requests,
auth_rate_limit_max_requests: data.auth_rate_limit_max_requests ?? this.config.auth_rate_limit_max_requests,
rate_limit_window_ms: data.rate_limit_window_ms ?? this.config.rate_limit_window_ms,
};
}
} catch {
// Fail-open: keep last known values if oversight-service is unreachable
}
}

getMaxRequests(): number {
return this.config.rate_limit_max_requests;
}

getAuthMaxRequests(): number {
return this.config.auth_rate_limit_max_requests;
}

getWindowMs(): number {
return this.config.rate_limit_window_ms;
}
}