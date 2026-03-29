import { apiClient } from './api-client';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  status: 'active' | 'suspended' | 'deleted';
  created_at: string;
}

export interface AdminCreateUserPayload {
	email: string;
	password: string;
	name: string;
	phone?: string;
	role: "customer" | "provider" | "admin";
	emailVerified?: boolean;
	timezone?: string;
	language?: string;
	status?: "active" | "suspended";
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
		role?: string;
		search?: string;
		sortBy?: string;
		sortOrder?: "asc" | "desc";
		page?: number;
	}): Promise<{ data: User[]; total: number }> {
		const searchParams = new URLSearchParams();
		if (params?.cursor) searchParams.append("cursor", params.cursor);
		if (params?.limit) searchParams.append("limit", params.limit.toString());
		if (params?.status) searchParams.append("status", params.status);
		if (params?.role) searchParams.append("role", params.role);
		if (params?.search) searchParams.append("search", params.search);
		if (params?.sortBy) searchParams.append("sortBy", params.sortBy);
		if (params?.sortOrder) searchParams.append("sortOrder", params.sortOrder);
		if (params?.page) searchParams.append("page", params.page.toString());

		const response = await apiClient.get<{ data: User[]; total: number }>(`/users?${searchParams.toString()}`);
		// API client unwraps standardized response and returns { data, total } for paginated responses
		return response.data;
	}

	async getUserById(id: string): Promise<User> {
		const response = await apiClient.get<User>(`/users/${id}`);
		return response.data;
	}

	async createUser(payload: AdminCreateUserPayload): Promise<User> {
		const response = await apiClient.post<User>("/users", payload);
		return response.data;
	}

	async suspendUser(id: string, reason: string): Promise<User> {
		const response = await apiClient.patch<User>(`/users/${id}/suspend`, { reason });
		return response.data;
	}

	async activateUser(id: string): Promise<User> {
		const response = await apiClient.patch<User>(`/users/${id}/activate`, {});
		return response.data;
	}

	async resetUserPassword(id: string, newPassword: string, reason?: string): Promise<{ success: true }> {
		const response = await apiClient.patch<{ success: true }>(`/users/${id}/reset-password`, { newPassword, reason });
		return response.data;
	}

	async deleteUser(id: string): Promise<User> {
		const response = await apiClient.delete<User>(`/users/${id}`);
		return response.data;
	}

	async restoreUser(id: string): Promise<User> {
		const response = await apiClient.patch<User>(`/users/${id}/restore`, {});
		return response.data;
	}

	async getDisputes(params?: {
		status?: string;
		cursor?: string;
		limit?: number;
		jobId?: string;
		openedBy?: string;
		sortBy?: string;
		sortOrder?: "asc" | "desc";
		page?: number;
	}): Promise<{ data: Dispute[]; total: number }> {
		const searchParams = new URLSearchParams();
		if (params?.status) searchParams.append("status", params.status);
		if (params?.cursor) searchParams.append("cursor", params.cursor);
		if (params?.limit) searchParams.append("limit", params.limit.toString());
		if (params?.jobId) searchParams.append("jobId", params.jobId);
		if (params?.openedBy) searchParams.append("openedBy", params.openedBy);
		if (params?.sortBy) searchParams.append("sortBy", params.sortBy);
		if (params?.sortOrder) searchParams.append("sortOrder", params.sortOrder);
		if (params?.page) searchParams.append("page", params.page.toString());

		const response = await apiClient.get<{ data: Dispute[]; total: number }>(
			`/admin/disputes?${searchParams.toString()}`,
		);
		// API client unwraps standardized response and returns { data, total } for paginated responses
		return response.data;
	}

	async getDisputeById(id: string): Promise<Dispute> {
		const response = await apiClient.get<Dispute>(`/admin/disputes/${id}`);
		return response.data;
	}

	async updateDispute(id: string, data: { status: string; resolution?: string }): Promise<Dispute> {
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
		if (params?.user_id) searchParams.append("user_id", params.user_id);
		if (params?.action) searchParams.append("action", params.action);
		if (params?.cursor) searchParams.append("cursor", params.cursor);
		if (params?.limit) searchParams.append("limit", params.limit.toString());

		const response = await apiClient.get<AuditLog[]>(`/admin/audit-logs?${searchParams.toString()}`);
		// API client unwraps standardized response
		return response.data || [];
	}

	async getSystemStats(): Promise<any> {
		const response = await apiClient.get<any>("/users/stats");
		return response.data;
	}
}

export const adminService = new AdminService();
