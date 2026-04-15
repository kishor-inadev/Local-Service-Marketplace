import { Controller, Get } from '@nestjs/common';
import { SystemSettingService } from '../admin/services/system-setting.service';

/**
 * Public (unauthenticated) endpoints exposed by the oversight-service.
 * Used by api-gateway and other internal services that cannot pass admin JWT.
 */
@Controller('public')
export class PublicController {
	constructor(private readonly systemSettingService: SystemSettingService) {}

	/**
	 * Returns the current maintenance mode status.
	 * Called by the api-gateway middleware with a 60-second TTL cache.
	 * No authentication required.
	 */
	@Get('maintenance-status')
	async getMaintenanceStatus() {
		const [modeResult, msgResult] = await Promise.allSettled([
			this.systemSettingService.getSettingByKey('maintenance_mode'),
			this.systemSettingService.getSettingByKey('maintenance_message'),
		]);

		const maintenanceMode =
			modeResult.status === 'fulfilled' && modeResult.value?.value === 'true';
		const maintenanceMessage =
			msgResult.status === 'fulfilled'
				? (msgResult.value?.value ?? '')
				: '';

		return { maintenance_mode: maintenanceMode, maintenance_message: maintenanceMessage };
	}

	/**
	 * Returns rate-limit configuration values for the api-gateway.
	 * Called by the gateway RateLimitConfigService with a 60-second TTL cache.
	 * No authentication required.
	 */
	@Get('rate-limit-config')
	async getRateLimitConfig() {
		const keys = [
			'rate_limit_max_requests',
			'auth_rate_limit_max_requests',
			'rate_limit_window_ms',
		];
		const results = await Promise.allSettled(
			keys.map((k) => this.systemSettingService.getSettingByKey(k)),
		);

		const getValue = (i: number, fallback: string) =>
			results[i].status === 'fulfilled' ? (results[i] as PromiseFulfilledResult<any>).value?.value ?? fallback : fallback;

		return {
			rate_limit_max_requests: parseInt(getValue(0, '500'), 10) || 500,
			auth_rate_limit_max_requests: parseInt(getValue(1, '10'), 10) || 10,
			rate_limit_window_ms: parseInt(getValue(2, '60000'), 10) || 60000,
		};
	}
}
