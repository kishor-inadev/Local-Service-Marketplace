import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { MaintenanceService } from '../services/maintenance.service';

@Injectable()
export class MaintenanceMiddleware implements NestMiddleware {
	constructor(private readonly maintenanceService: MaintenanceService) {}

	use(req: Request, res: Response, next: NextFunction): void {
		// Allow health checks and the maintenance status endpoint itself to pass through
		if (req.path === '/health' || req.path === '/favicon.ico') {
			return next();
		}

		if (this.maintenanceService.isInMaintenance()) {
			const message =
				this.maintenanceService.getMessage() ||
				'The platform is currently under maintenance. Please check back shortly.';

			res.status(503).json({
				success: false,
				statusCode: 503,
				message,
				error: 'ServiceUnavailable',
				timestamp: new Date().toISOString(),
			});
			return;
		}

		next();
	}
}
