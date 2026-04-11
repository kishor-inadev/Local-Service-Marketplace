import { apiClient } from './api-client';

export interface User {
	id: string;
	display_id?: string;
	email: string;
	name?: string;
	role: string;
	status: "active" | "suspended" | "deleted";
	created_at: string;
}

type ApiUser = Partial<User> & { createdAt?: string };

const normalizeUser = (user: ApiUser): User => ({
	id: String(user.id || ""),
	email: String(user.email || ""),
	name: user.name || undefined,
	role: String(user.role || "customer"),
	status: (user.status as User["status"]) || "active",
	created_at: String(user.created_at || user.createdAt || ""),
});

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
  display_id?: string;
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

		const response = await apiClient.get<{ data: ApiUser[]; total: number }>(`/users?${searchParams.toString()}`);
		// API client unwraps standardized response and returns { data, total } for paginated responses
		return { data: (response.data?.data || []).map(normalizeUser), total: response.data?.total || 0 };
	}

	async getUserById(id: string): Promise<User> {
		const response = await apiClient.get<ApiUser>(`/users/${id}`);
		return normalizeUser(response.data || {});
	}

	async createUser(payload: AdminCreateUserPayload): Promise<User> {
		const response = await apiClient.post<ApiUser>("/users", payload);
		return normalizeUser(response.data || {});
	}

	async suspendUser(id: string, reason: string): Promise<User> {
		const response = await apiClient.patch<ApiUser>(`/users/${id}/suspend`, { reason });
		return normalizeUser(response.data || {});
	}

	async activateUser(id: string): Promise<User> {
		const response = await apiClient.patch<ApiUser>(`/users/${id}/activate`, {});
		return normalizeUser(response.data || {});
	}

	async resetUserPassword(id: string, newPassword: string, reason?: string): Promise<{ success: true }> {
		const response = await apiClient.patch<{ success: true }>(`/users/${id}/reset-password`, { newPassword, reason });
		return response.data;
	}

	async deleteUser(id: string): Promise<User> {
		const response = await apiClient.delete<ApiUser>(`/users/${id}`);
		return normalizeUser(response.data || {});
	}

	async restoreUser(id: string): Promise<User> {
		const response = await apiClient.patch<ApiUser>(`/users/${id}/restore`, {});
		return normalizeUser(response.data || {});
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

	async getSystemStats(): Promise<{
		total: number;
		byStatus: { active: number; suspended: number };
		byRole: { customer: number; provider: number; admin: number };
	}> {
		const response = await apiClient.get<{
			total: number;
			byStatus: { active: number; suspended: number };
			byRole: { customer: number; provider: number; admin: number };
		}>("/users/stats");
		return response.data;
	}

	async getDisputeStats(): Promise<{
		total: number;
		byStatus: { open: number; investigating: number; resolved: number; closed: number };
	}> {
		const response = await apiClient.get<{
			total: number;
			byStatus: { open: number; investigating: number; resolved: number; closed: number };
		}>("/admin/disputes/stats");
		return response.data;
	}

	async getJobStats(): Promise<{
		total: number;
		byStatus: { scheduled: number; in_progress: number; completed: number; cancelled: number; disputed: number };
	}> {
		const response = await apiClient.get<{
			total: number;
			byStatus: { scheduled: number; in_progress: number; completed: number; cancelled: number; disputed: number };
		}>("/jobs/stats");
		return response.data;
	}

	async getRequestStats(): Promise<{
		total: number;
		byStatus: { open: number; assigned: number; completed: number; cancelled: number };
	}> {
		const response = await apiClient.get<{
			total: number;
			byStatus: { open: number; assigned: number; completed: number; cancelled: number };
		}>("/requests/stats");
		return response.data;
	}

	async getPaymentStats(): Promise<{
		total: number;
		totalRevenue: number;
		byStatus: { pending: number; completed: number; failed: number; refunded: number };
	}> {
		const response = await apiClient.get<{
			total: number;
			totalRevenue: number;
			byStatus: { pending: number; completed: number; failed: number; refunded: number };
		}>("/payments/stats");
		return response.data;
	}

	async getPendingProviders(params?: { page?: number; limit?: number }): Promise<{ data: any[]; total: number }> {
		const qs = new URLSearchParams();
		if (params?.page) qs.append('page', String(params.page));
		if (params?.limit) qs.append('limit', String(params.limit));
		qs.append('verification_status', 'pending');
		const response = await apiClient.get<any>(`/providers?${qs.toString()}`);
		const raw = response.data;
		return { data: raw?.data ?? [], total: raw?.total ?? 0 };
	}

	async getProviderDocuments(providerId: string): Promise<any[]> {
		const response = await apiClient.get<any>(`/providers/${providerId}/documents`);
		return apiClient.extractList<any>(response.data);
	}

	async verifyProvider(providerId: string): Promise<any> {
		const response = await apiClient.patch<any>(`/providers/${providerId}/verify`, {});
		return response.data;
	}

	async rejectProvider(providerId: string, reason: string): Promise<any> {
		const response = await apiClient.patch<any>(`/providers/${providerId}/reject`, { reason });
		return response.data;
	}

	async verifyDocument(documentId: string): Promise<any> {
		const response = await apiClient.patch<any>(`/provider-documents/${documentId}/verify`, {});
		return response.data;
	}

	async rejectDocument(documentId: string, reason: string): Promise<any> {
		const response = await apiClient.patch<any>(`/provider-documents/${documentId}/reject`, { reason });
		return response.data;
	}

	async getCategories(): Promise<any[]> {
		const response = await apiClient.get<any>('/categories');
		return apiClient.extractList<any>(response.data);
	}

	async createCategory(data: { name: string; description?: string; icon?: string }): Promise<any> {
		const response = await apiClient.post<any>('/categories', data);
		return response.data;
	}

	async updateCategory(id: string, data: { name?: string; description?: string; icon?: string; active?: boolean }): Promise<any> {
		const response = await apiClient.patch<any>(`/categories/${id}`, data);
		return response.data;
	}

	async deleteCategory(id: string): Promise<void> {
		await apiClient.delete(`/categories/${id}`);
	}

	async getDailyMetrics(params?: { days?: number }): Promise<any[]> {
		const qs = new URLSearchParams();
		if (params?.days) qs.append('days', String(params.days));
		const response = await apiClient.get<any>(`/analytics/daily-metrics?${qs.toString()}`);
		return apiClient.extractList<any>(response.data);
	}

	async getAnalyticsSummary(): Promise<any> {
		const response = await apiClient.get<any>('/analytics/summary');
		return response.data;
	}

	async updateSystemSetting(key: string, value: string): Promise<any> {
		const response = await apiClient.patch<any>(`/admin/settings/${key}`, { value });
		return response.data;
	}

	async getSystemSettings(): Promise<any[]> {
		const response = await apiClient.get<any>('/admin/settings');
		return apiClient.extractList<any>(response.data);
	}
}

export const adminService = new AdminService();
