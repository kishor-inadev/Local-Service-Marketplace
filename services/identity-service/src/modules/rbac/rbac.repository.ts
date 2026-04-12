import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { DATABASE_POOL } from '@/common/database/database.module';

@Injectable()
export class RbacRepository {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  // ─── Roles ─────────────────────────────────────────────────────────

  async findAllRoles(includeInactive = false) {
    const query = includeInactive
      ? `SELECT * FROM roles ORDER BY is_system DESC, name ASC`
      : `SELECT * FROM roles WHERE is_active = true ORDER BY is_system DESC, name ASC`;
    const result = await this.pool.query(query);
    return result.rows;
  }

  async findRoleById(id: string) {
    const result = await this.pool.query('SELECT * FROM roles WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async findRoleByName(name: string) {
    const result = await this.pool.query('SELECT * FROM roles WHERE name = $1', [name]);
    return result.rows[0] || null;
  }

  async createRole(name: string, displayName: string, description?: string) {
    const result = await this.pool.query(
      `INSERT INTO roles (name, display_name, description, is_system, is_active)
       VALUES ($1, $2, $3, false, true)
       RETURNING *`,
      [name, displayName, description || null],
    );
    return result.rows[0];
  }

  async updateRole(id: string, displayName?: string, description?: string, isActive?: boolean) {
    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (displayName !== undefined) {
      updates.push(`display_name = $${idx++}`);
      values.push(displayName);
    }
    if (description !== undefined) {
      updates.push(`description = $${idx++}`);
      values.push(description);
    }
    if (isActive !== undefined) {
      updates.push(`is_active = $${idx++}`);
      values.push(isActive);
    }
    updates.push(`updated_at = now()`);

    if (updates.length === 1) return this.findRoleById(id); // only updated_at

    values.push(id);
    const result = await this.pool.query(
      `UPDATE roles SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      values,
    );
    return result.rows[0] || null;
  }

  async deleteRole(id: string) {
    const result = await this.pool.query(
      'DELETE FROM roles WHERE id = $1 AND is_system = false RETURNING *',
      [id],
    );
    return result.rows[0] || null;
  }

  // ─── Permissions ───────────────────────────────────────────────────

  async findAllPermissions() {
    const result = await this.pool.query(
      'SELECT * FROM permissions ORDER BY resource ASC, action ASC',
    );
    return result.rows;
  }

  async findPermissionsByIds(ids: string[]) {
    if (!ids.length) return [];
    const result = await this.pool.query(
      'SELECT * FROM permissions WHERE id = ANY($1::uuid[])',
      [ids],
    );
    return result.rows;
  }

  // ─── Role Permissions ──────────────────────────────────────────────

  async findPermissionsByRoleId(roleId: string) {
    const result = await this.pool.query(
      `SELECT p.* FROM permissions p
       JOIN role_permissions rp ON rp.permission_id = p.id
       WHERE rp.role_id = $1
       ORDER BY p.resource ASC, p.action ASC`,
      [roleId],
    );
    return result.rows;
  }

  async findPermissionsByRoleName(roleName: string): Promise<string[]> {
    const result = await this.pool.query(
      `SELECT p.name FROM permissions p
       JOIN role_permissions rp ON rp.permission_id = p.id
       JOIN roles r ON r.id = rp.role_id
       WHERE r.name = $1 AND r.is_active = true
       ORDER BY p.name ASC`,
      [roleName],
    );
    return result.rows.map((row: any) => row.name);
  }

  async setRolePermissions(roleId: string, permissionIds: string[]) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Remove existing permissions
      await client.query('DELETE FROM role_permissions WHERE role_id = $1', [roleId]);

      // Insert new permissions
      if (permissionIds.length > 0) {
        const values = permissionIds
          .map((_, i) => `($1, $${i + 2}, now())`)
          .join(', ');
        await client.query(
          `INSERT INTO role_permissions (role_id, permission_id, created_at) VALUES ${values}
           ON CONFLICT DO NOTHING`,
          [roleId, ...permissionIds],
        );
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async addPermissionsToRole(roleId: string, permissionIds: string[]) {
    if (!permissionIds.length) return;
    const values = permissionIds
      .map((_, i) => `($1, $${i + 2}, now())`)
      .join(', ');
    await this.pool.query(
      `INSERT INTO role_permissions (role_id, permission_id, created_at) VALUES ${values}
       ON CONFLICT DO NOTHING`,
      [roleId, ...permissionIds],
    );
  }

  async removePermissionsFromRole(roleId: string, permissionIds: string[]) {
    if (!permissionIds.length) return;
    await this.pool.query(
      `DELETE FROM role_permissions WHERE role_id = $1 AND permission_id = ANY($2::uuid[])`,
      [roleId, permissionIds],
    );
  }

  // ─── User Role ─────────────────────────────────────────────────────

  async updateUserRole(userId: string, roleId: string) {
    const result = await this.pool.query(
      `UPDATE users SET role_id = $1, updated_at = now() WHERE id = $2 AND deleted_at IS NULL RETURNING id, role, role_id`,
      [roleId, userId],
    );
    return result.rows[0] || null;
  }

  async getUsersCountByRole(roleId: string): Promise<number> {
    const result = await this.pool.query(
      'SELECT COUNT(*)::int as count FROM users WHERE role_id = $1 AND deleted_at IS NULL',
      [roleId],
    );
    return result.rows[0].count;
  }

  // ─── Role with permissions (joined) ────────────────────────────────

  async findRoleWithPermissions(roleId: string) {
    const role = await this.findRoleById(roleId);
    if (!role) return null;
    const permissions = await this.findPermissionsByRoleId(roleId);
    return { ...role, permissions };
  }

  async findAllRolesWithPermissions(includeInactive = false) {
    const roles = await this.findAllRoles(includeInactive);
    const results = [];
    for (const role of roles) {
      const permissions = await this.findPermissionsByRoleId(role.id);
      results.push({ ...role, permissions });
    }
    return results;
  }
}
