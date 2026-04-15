import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

/**
 * Polls oversight-service /public/maintenance-status every 60 seconds
 * and caches the result in memory.  All gateway requests check this flag
 * before proxying to upstream services.
 */
@Injectable()
export class MaintenanceService implements OnModuleInit, OnModuleDestroy {
	private maintenanceMode = false;
	private maintenanceMessage = '';
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
		await this.refresh();
		this.timer = setInterval(() => this.refresh(), this.POLL_INTERVAL_MS);
	}

	onModuleDestroy() {
		if (this.timer) clearInterval(this.timer);
	}

	private async refresh(): Promise<void> {
		try {
			const response = await firstValueFrom(
				this.httpService.get(`${this.oversightUrl}/public/maintenance-status`, {
					timeout: 3000,
				}),
			);
			const data = response.data?.data ?? response.data;
			if (data) {
				this.maintenanceMode =
					data.maintenance_mode === true || data.maintenance_mode === 'true';
				this.maintenanceMessage = data.maintenance_message ?? '';
			}
		} catch {
			// Fail open: if oversight-service is unreachable, assume no maintenance
		}
	}

	isInMaintenance(): boolean {
		return this.maintenanceMode;
	}

	getMessage(): string {
		return this.maintenanceMessage;
	}
}
