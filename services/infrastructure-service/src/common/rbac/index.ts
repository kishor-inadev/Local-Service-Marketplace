import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SetMetadata } from '@nestjs/common';

// ── Metadata keys ────────────────────────────────────────────────────
export const PERMISSIONS_KEY = 'permissions';
export const ROLES_KEY = 'roles';

// ── Decorators ───────────────────────────────────────────────────────
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

// ── Utility functions ────────────────────────────────────────────────
export function hasPermission(userPermissions: string[], required: string): boolean {
  return userPermissions.includes(required);
}

export function hasAnyPermission(userPermissions: string[], required: string[]): boolean {
  return required.some((p) => userPermissions.includes(p));
}

export function hasAllPermissions(userPermissions: string[], required: string[]): boolean {
  return required.every((p) => userPermissions.includes(p));
}

// ── Interfaces ───────────────────────────────────────────────────────
export interface RoleEntity {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  is_system: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at?: Date;
}

export interface PermissionEntity {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  resource: string;
  action: string;
  created_at: Date;
}

export interface RoleWithPermissions extends RoleEntity {
  permissions: PermissionEntity[];
}

export interface RbacUser {
  userId: string;
  email: string;
  role: string;
  permissions: string[];
  name?: string;
  phone?: string;
  providerId?: string;
}

// ── Guard ────────────────────────────────────────────────────────────
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (requiredPermissions && requiredPermissions.length > 0) {
      if (!user) {
        throw new ForbiddenException('User not authenticated');
      }
      const userPermissions: string[] = user.permissions || [];
      if (!hasAnyPermission(userPermissions, requiredPermissions)) {
        throw new ForbiddenException(
          `Access denied. Required permission(s): ${requiredPermissions.join(', ')}`,
        );
      }
      return true;
    }

    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const hasRole = requiredRoles.some((role) => user.role === role);
    if (!hasRole) {
      throw new ForbiddenException(
        `Access denied. Required role(s): ${requiredRoles.join(', ')}. Your role: ${user.role}`,
      );
    }

    return true;
  }
}
