import { SetMetadata } from "@nestjs/common";

/**
 * Roles Decorator
 *
 * Use this decorator to specify which user roles can access an endpoint.
 *
 * @param roles - Array of allowed roles ('admin', 'provider', 'customer')
 *
 * @example
 * ```typescript
 * @Roles('admin')
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * @Get('admin/users')
 * getUsers() { ... }
 * ```
 *
 * @example Multiple roles
 * ```typescript
 * @Roles('admin', 'provider')
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * @Get('dashboard')
 * getDashboard() { ... }
 * ```
 */
export const ROLES_KEY = "roles";
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
