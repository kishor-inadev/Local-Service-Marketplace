import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionsGuard as RolesGuard, Roles, RequirePermissions } from '@/common/rbac';
import { RbacService } from './rbac.service';
import { CreateRoleDto, UpdateRoleDto, AssignPermissionsDto, ChangeUserRoleDto } from './rbac.dto';

@Controller()
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class RbacController {
  constructor(private readonly rbacService: RbacService) {}

  // ─── Roles ─────────────────────────────────────────────────────────

  @Get('roles')
  @RequirePermissions('roles.manage')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async listRoles(@Query('includeInactive') includeInactive?: string) {
    const roles = await this.rbacService.listRoles(includeInactive === 'true');
    return { message: 'Roles retrieved', data: roles };
  }

  @Get('roles/:id')
  @RequirePermissions('roles.manage')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getRoleById(@Param('id') id: string) {
    const role = await this.rbacService.getRoleById(id);
    return { message: 'Role retrieved', data: role };
  }

  @Post('roles')
  @RequirePermissions('roles.manage')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async createRole(@Body() dto: CreateRoleDto) {
    const role = await this.rbacService.createRole(dto);
    return { message: 'Role created', data: role };
  }

  @Patch('roles/:id')
  @RequirePermissions('roles.manage')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async updateRole(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    const role = await this.rbacService.updateRole(id, dto);
    return { message: 'Role updated', data: role };
  }

  @Delete('roles/:id')
  @RequirePermissions('roles.manage')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async deleteRole(@Param('id') id: string) {
    const result = await this.rbacService.deleteRole(id);
    return { message: 'Role deleted', data: result };
  }

  // ─── Permissions ───────────────────────────────────────────────────

  @Get('permissions')
  @RequirePermissions('roles.manage')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async listPermissions() {
    const permissions = await this.rbacService.listPermissions();
    return { message: 'Permissions retrieved', data: permissions };
  }

  // ─── Role Permissions ──────────────────────────────────────────────

  @Get('roles/:id/permissions')
  @RequirePermissions('roles.manage')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getRolePermissions(@Param('id') id: string) {
    const permissions = await this.rbacService.getPermissionsForRoleById(id);
    return { message: 'Role permissions retrieved', data: permissions };
  }

  @Put('roles/:id/permissions')
  @RequirePermissions('roles.manage')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async setRolePermissions(@Param('id') id: string, @Body() dto: AssignPermissionsDto) {
    const role = await this.rbacService.setRolePermissions(id, dto.permission_ids);
    return { message: 'Role permissions updated', data: role };
  }

  @Post('roles/:id/permissions/add')
  @RequirePermissions('roles.manage')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async addPermissionsToRole(@Param('id') id: string, @Body() dto: AssignPermissionsDto) {
    const role = await this.rbacService.addPermissionsToRole(id, dto.permission_ids);
    return { message: 'Permissions added to role', data: role };
  }

  @Post('roles/:id/permissions/remove')
  @RequirePermissions('roles.manage')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async removePermissionsFromRole(@Param('id') id: string, @Body() dto: AssignPermissionsDto) {
    const role = await this.rbacService.removePermissionsFromRole(id, dto.permission_ids);
    return { message: 'Permissions removed from role', data: role };
  }

  // ─── User Role Assignment ──────────────────────────────────────────

  @Patch('users/:userId/role')
  @RequirePermissions('roles.manage')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async changeUserRole(@Param('userId') userId: string, @Body() dto: ChangeUserRoleDto) {
    const result = await this.rbacService.changeUserRole(userId, dto.role_id);
    return { message: 'User role updated', data: result };
  }
}
