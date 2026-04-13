import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Mark an endpoint as not requiring JWT authentication.
 * The class-level JwtAuthGuard will skip the auth check for decorated handlers.
 * Used for internal service-to-service endpoints protected by InternalServiceGuard instead.
 */
export const SkipAuth = () => SetMetadata(IS_PUBLIC_KEY, true);
