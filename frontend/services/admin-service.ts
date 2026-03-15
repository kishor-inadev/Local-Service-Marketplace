import { apiClient } from './api-client';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  status: 'active' | 'suspended' | 'deleted';
  created_at: string;
}

export interface Dispute {
  id: string;
  job_id: string;
  opened_by: string;
  reason: string;
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  resolution?: string;
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  entity: string;
  entity_id: string;
  metadata?: any;
  created_at: string;
}

class AdminService {
  async getUsers(params?: {
    cursor?: string;
    limit?: number;
    status?: string;
  }): Promise<User[]> {
    const searchParams = new URLSearchParams();
    if (params?.cursor) searchParams.append('cursor', params.cursor);
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.status) searchParams.append('status', params.status);

    const response = await apiClient.get<User[]>(`/admin/users?${searchParams.toString()}`);
    // API client unwraps standardized response
    return response.data || [];
  }

  async getUserById(id: string): Promise<User> {
    const response = await apiClient.get<User>(`/admin/users/${id}`);
    return response.data;
  }

  async suspendUser(id: string, reason: string): Promise<User> {
    const response = await apiClient.patch<User>(`/admin/users/${id}/suspend`, { reason });
    return response.data;
  }

  async activateUser(id: string): Promise<User> {
    const response = await apiClient.patch<User>(`/admin/users/${id}/activate`, {});
    return response.data;
  }

  async getDisputes(params?: {
    status?: string;
    cursor?: string;
    limit?: number;
  }): Promise<Dispute[]> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.cursor) searchParams.append('cursor', params.cursor);
    if (params?.limit) searchParams.append('limit', params.limit.toString());

    const response = await apiClient.get<Dispute[]>(
      `/admin/disputes?${searchParams.toString()}`,
    );
    // API client unwraps standardized response
    return response.data || [];
  }

  async updateDispute(
    id: string,
    data: { status: string; resolution?: string },
  ): Promise<Dispute> {
    const response = await apiClient.patch<Dispute>(`/admin/disputes/${id}`, data);
    return response.data;
  }

  async getAuditLogs(params?: {
    user_id?: string;
    action?: string;
    cursor?: string;
    limit?: number;
  }): Promise<AuditLog[]> {
    const searchParams = new URLSearchParams();
    if (params?.user_id) searchParams.append('user_id', params.user_id);
    if (params?.action) searchParams.append('action', params.action);
    if (params?.cursor) searchParams.append('cursor', params.cursor);
    if (params?.limit) searchParams.append('limit', params.limit.toString());

    const response = await apiClient.get<AuditLog[]>(
      `/admin/audit-logs?${searchParams.toString()}`,
    );
    // API client unwraps standardized response
    return response.data || [];
  }

  async getSystemStats(): Promise<any> {
    const response = await apiClient.get<any>('/admin/stats');
    return response.data;
  }
}

export const adminService = new AdminService();
