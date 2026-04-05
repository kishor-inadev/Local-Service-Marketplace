import { Injectable, NestMiddleware, Inject, LoggerService } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as jwt from 'jsonwebtoken';
import { UnauthorizedException } from '../../common/exceptions/http.exceptions';
import { publicRoutes, publicGetRoutes } from '../config/services.config';
import { ConfigService } from '@nestjs/config';

interface UserInfo {
  userId: string;
  email: string;
  role: string;
  name?: string;
  phone?: string;
}

@Injectable()
export class JwtAuthMiddleware implements NestMiddleware {
  private readonly authServiceUrl: string;
  private readonly gatewaySecret: string;
  private readonly jwtSecret: string;
  private readonly validationStrategy: 'local' | 'api';

  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.authServiceUrl = this.configService.get<string>('AUTH_SERVICE_URL', 'http://localhost:3001');
    this.gatewaySecret = this.configService.get<string>("GATEWAY_INTERNAL_SECRET", "");
		this.jwtSecret = this.configService.get<string>("JWT_SECRET", "");
    this.validationStrategy = this.configService.get<'local' | 'api'>('TOKEN_VALIDATION_STRATEGY', 'local');

    // Fail fast in production if critical secrets are missing
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');
    if (nodeEnv === 'production') {
      if (!this.gatewaySecret) {
        throw new Error('GATEWAY_INTERNAL_SECRET must be set in production');
      }
      if (!this.jwtSecret) {
        throw new Error('JWT_SECRET must be set in production');
      }
    } else {
      // Development fallbacks with warnings
      if (!this.gatewaySecret) {
        this.gatewaySecret = 'gateway-internal-secret-dev-only';
        this.logger.warn('GATEWAY_INTERNAL_SECRET not set — using insecure dev default', 'JwtAuthMiddleware');
      }
      if (!this.jwtSecret) {
        this.jwtSecret = 'jwt-secret-dev-only';
        this.logger.warn('JWT_SECRET not set — using insecure dev default', 'JwtAuthMiddleware');
      }
    }
    
    this.logger.log(`JWT validation strategy: ${this.validationStrategy}`, 'JwtAuthMiddleware');
  }

  use(req: Request, res: Response, next: NextFunction) {
		const path = req.originalUrl.split("?")[0]; // strip query string
		const method = req.method.toUpperCase();
		const normalizedPath = path.endsWith("/") && path.length > 1 ? path.slice(0, -1) : path;

		// Public contact submission must be POST only; admin contact read/update routes stay protected.
		const isPublicContactSubmission = method === "POST" && normalizedPath === "/api/v1/admin/contact";

		// Check if route is fully public (all methods)
		const isPublicRoute =
			isPublicContactSubmission ||
			publicRoutes
				.filter((route) => route !== "/api/v1/admin/contact")
				.some((route) => normalizedPath.startsWith(route));

		// Check if route is public for GET requests only
		const isPublicGetRoute = method === "GET" && publicGetRoutes.some((route) => normalizedPath.startsWith(route));

		if (isPublicRoute || isPublicGetRoute) {
			return next();
		}

		// Extract JWT token from Authorization header
		const authHeader = req.headers.authorization;

		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			this.logger.error(`Missing or invalid Authorization header for ${method} ${path}`, "JwtAuthMiddleware");
			throw new UnauthorizedException(`Missing or invalid authorization token`);
		}

		const token = authHeader.substring(7); // Remove 'Bearer ' prefix

		// Handle async validation — pass errors to Express error handler
		this.validateToken(token, req, next).catch((error) => {
			this.logger.error(`Token validation error: ${error.message}`, error.stack, "JwtAuthMiddleware");
			next(error);
		});
	}

	/**
	 * Validate token using configured strategy
	 */
	private async validateToken(token: string, req: Request, next: NextFunction): Promise<void> {
		try {
			let userInfo: UserInfo;

			if (this.validationStrategy === 'api') {
				// API-based validation: Call auth service
				userInfo = await this.verifyTokenViaAPI(token);
			} else {
				// Local validation: Verify JWT locally
				userInfo = await this.verifyTokenLocally(token);
			}

			// Attach user info to request
			(req as any).user = userInfo;

			this.logger.log(
				`Token verified (${this.validationStrategy}) for user: ${userInfo.userId}`,
				"JwtAuthMiddleware"
			);

			next();
		} catch (error) {
			this.logger.error(
				`Token verification failed (${this.validationStrategy}): ${error.message}`,
				error.stack,
				"JwtAuthMiddleware"
			);
			throw new UnauthorizedException("Invalid or expired token");
		}
	}

	/**
	 * Verify token locally using JWT library (faster, no network call)
	 */
	private async verifyTokenLocally(token: string): Promise<UserInfo> {
		try {
			const decoded: any = jwt.verify(token, this.jwtSecret);

			// Normalize the payload to consistent UserInfo structure
			return {
				userId: decoded.sub || decoded.userId || decoded.id,
				email: decoded.email,
				role: decoded.role || 'user',
				name: decoded.name,
				phone: decoded.phone,
			};
		} catch (error) {
			this.logger.error(`Local JWT verification failed: ${error.message}`, 'JwtAuthMiddleware');
			throw new UnauthorizedException('Invalid or expired token');
		}
	}

	/**
	 * Verify token via Auth Service API (centralized, can check user status)
	 */
	private async verifyTokenViaAPI(token: string): Promise<UserInfo> {
		try {
			const response = await firstValueFrom(
				this.httpService.post(
					`${this.authServiceUrl}/auth/verify`,
					{ token },
					{
						headers: {
							'x-gateway-secret': this.gatewaySecret,
							'Content-Type': 'application/json',
						},
						timeout: 5000, // 5 seconds timeout
					},
				),
			);

			const data = response.data;

			// Normalize to consistent UserInfo structure
			return {
				userId: data.userId,
				email: data.email,
				role: data.role,
				name: data.name,
				phone: data.phone,
			};
		} catch (error) {
			this.logger.error(`API token verification failed: ${error.message}`, 'JwtAuthMiddleware');
			if (error.response?.status === 401) {
				throw new UnauthorizedException('Invalid or expired token');
			}
			throw new UnauthorizedException('Token verification service unavailable');
		}
	}
}
