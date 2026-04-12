import { Injectable, Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { RbacRepository } from './rbac.repository';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@/common/exceptions/http.exceptions';
import { CreateRoleDto, UpdateRoleDto } from './rbac.dto';

@Injectable()
export class RbacService {
  private permissionCache: Map<string, { permissions: string[]; expiresAt: number }> = new Map();
  private readonly cacheTtlMs = 5 * 60 * 1000; // 5 minutes

  constructor(
    private readonly rbacRepo: RbacRepository,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  // ─── Permission Resolution (used by JWT service) ───────────────────

  /**
   * Get permission names for a role. Uses in-memory cache with TTL.
   */
  async getPermissionsForRole(roleName: string): Promise<string[]> {
    const cached = this.permissionCache.get(roleName);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.permissions;
    }

    const permissions = await this.rbacRepo.findPermissionsByRoleName(roleName);
    this.permissionCache.set(roleName, {
      permissions,
      expiresAt: Date.now() + this.cacheTtlMs,
    });

    return permissions;
  }

  /**
   * Invalidate cached permissions for a role (call after permission updates).
   */
  invalidateCache(roleName?: string) {
    if (roleName) {
      this.permissionCache.delete(roleName);
    } else {
      this.permissionCache.clear();
    }
  }

  // ─── Roles CRUD ────────────────────────────────────────────────────

  async listRoles(includeInactive = false) {
    return this.rbacRepo.findAllRolesWithPermissions(includeInactive);
  }

  async getRoleById(id: string) {
    const role = await this.rbacRepo.findRoleWithPermissions(id);
    if (!role) throw new NotFoundException('Role not found');
    return role;
  }

  async getPermissionsForRoleById(roleId: string) {
    return this.rbacRepo.findPermissionsByRoleId(roleId);
  }

  async createRole(dto: CreateRoleDto) {
    const existing = await this.rbacRepo.findRoleByName(dto.name);
    if (existing) {
      throw new ConflictException(`Role with name '${dto.name}' already exists`);
    }

    const role = await this.rbacRepo.createRole(dto.name, dto.display_name, dto.description);
    this.logger.info('Role created', { roleId: role.id, roleName: role.name });
    return { ...role, permissions: [] };
  }

  async updateRole(id: string, dto: UpdateRoleDto) {
    const role = await this.rbacRepo.findRoleById(id);
    if (!role) throw new NotFoundException('Role not found');

    // System roles cannot be deactivated
    if (role.is_system && dto.is_active === false) {
      throw new ForbiddenException('System roles cannot be deactivated');
    }

    const updated = await this.rbacRepo.updateRole(id, dto.display_name, dto.description, dto.is_active);
    this.logger.info('Role updated', { roleId: id });
    return this.rbacRepo.findRoleWithPermissions(id);
  }

  async deleteRole(id: string) {
    const role = await this.rbacRepo.findRoleById(id);
    if (!role) throw new NotFoundException('Role not found');
    if (role.is_system) throw new ForbiddenException('System roles cannot be deleted');

    const usersCount = await this.rbacRepo.getUsersCountByRole(id);
    if (usersCount > 0) {
      throw new BadRequestException(
        `Cannot delete role '${role.name}': ${usersCount} user(s) are still assigned to it. Reassign them first.`,
      );
    }

    await this.rbacRepo.deleteRole(id);
    this.invalidateCache(role.name);
    this.logger.info('Role deleted', { roleId: id, roleName: role.name });
    return { deleted: true };
  }

  // ─── Permissions ───────────────────────────────────────────────────

  async listPermissions() {
    return this.rbacRepo.findAllPermissions();
  }

  // ─── Role Permissions ──────────────────────────────────────────────

  async setRolePermissions(roleId: string, permissionIds: string[]) {
    const role = await this.rbacRepo.findRoleById(roleId);
    if (!role) throw new NotFoundException('Role not found');

    // Validate all permission IDs exist
    if (permissionIds.length > 0) {
      const found = await this.rbacRepo.findPermissionsByIds(permissionIds);
      if (found.length !== permissionIds.length) {
        const foundIds = new Set(found.map((p: any) => p.id));
        const missing = permissionIds.filter((id) => !foundIds.has(id));
        throw new BadRequestException(`Invalid permission IDs: ${missing.join(', ')}`);
      }
    }

    await this.rbacRepo.setRolePermissions(roleId, permissionIds);
    this.invalidateCache(role.name);
    this.logger.info('Role permissions updated', { roleId, permissionCount: permissionIds.length });
    return this.rbacRepo.findRoleWithPermissions(roleId);
  }

  async addPermissionsToRole(roleId: string, permissionIds: string[]) {
    const role = await this.rbacRepo.findRoleById(roleId);
    if (!role) throw new NotFoundException('Role not found');

    await this.rbacRepo.addPermissionsToRole(roleId, permissionIds);
    this.invalidateCache(role.name);
    return this.rbacRepo.findRoleWithPermissions(roleId);
  }

  async removePermissionsFromRole(roleId: string, permissionIds: string[]) {
    const role = await this.rbacRepo.findRoleById(roleId);
    if (!role) throw new NotFoundException('Role not found');

    await this.rbacRepo.removePermissionsFromRole(roleId, permissionIds);
    this.invalidateCache(role.name);
    return this.rbacRepo.findRoleWithPermissions(roleId);
  }

  // ─── User Role Assignment ──────────────────────────────────────────

  async changeUserRole(userId: string, roleId: string) {
    const role = await this.rbacRepo.findRoleById(roleId);
    if (!role) throw new NotFoundException('Role not found');
    if (!role.is_active) throw new BadRequestException('Cannot assign an inactive role');

    const updated = await this.rbacRepo.updateUserRole(userId, roleId);
    if (!updated) throw new NotFoundException('User not found');

    this.logger.info('User role changed', { userId, newRoleId: roleId, newRoleName: role.name });
    return updated;
  }
}
