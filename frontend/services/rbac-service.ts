import { apiClient } from './api-client';

export interface RolePermission {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  resource: string;
  action: string;
}

export interface Role {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  is_system: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  permissions?: RolePermission[];
  user_count?: number;
}

export interface CreateRolePayload {
  name: string;
  display_name: string;
  description?: string;
}

export interface UpdateRolePayload {
  display_name?: string;
  description?: string;
  is_active?: boolean;
}

export interface AssignPermissionsPayload {
  permission_ids: string[];
}

export const rbacService = {
  // ── Roles ───────────────────────────────────────────────────────────────
  async getRoles(): Promise<Role[]> {
    const res = await apiClient.get('/identity/roles');
    return res.data?.data ?? res.data ?? [];
  },

  async getRole(id: string): Promise<Role> {
    const res = await apiClient.get(`/identity/roles/${id}`);
    return res.data?.data ?? res.data;
  },

  async createRole(payload: CreateRolePayload): Promise<Role> {
    const res = await apiClient.post('/identity/roles', payload);
    return res.data?.data ?? res.data;
  },

  async updateRole(id: string, payload: UpdateRolePayload): Promise<Role> {
    const res = await apiClient.patch(`/identity/roles/${id}`, payload);
    return res.data?.data ?? res.data;
  },

  async deleteRole(id: string): Promise<void> {
    await apiClient.delete(`/identity/roles/${id}`);
  },

  // ── Permissions ─────────────────────────────────────────────────────────
  async getPermissions(): Promise<RolePermission[]> {
    const res = await apiClient.get('/identity/permissions');
    return res.data?.data ?? res.data ?? [];
  },

  // ── Role ↔ Permissions ─────────────────────────────────────────────────
  async getRolePermissions(roleId: string): Promise<RolePermission[]> {
    const res = await apiClient.get(`/identity/roles/${roleId}/permissions`);
    return res.data?.data ?? res.data ?? [];
  },

  async assignPermissions(roleId: string, payload: AssignPermissionsPayload): Promise<void> {
    await apiClient.put(`/identity/roles/${roleId}/permissions`, payload);
  },
};
