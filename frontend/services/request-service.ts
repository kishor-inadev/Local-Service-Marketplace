import { apiClient } from "./api-client";

export interface ServiceCategory {
	id: string;
	display_id?: string;
	name: string;
	description?: string;
	icon?: string;
	active: boolean;
	created_at: string;
}

export interface ServiceRequest {
	id: string;
	display_id?: string;
	user_id?: string | null;
	category_id: string;
	description: string;
	budget: number;
	status: "open" | "assigned" | "completed" | "cancelled";
	// Guest information for anonymous requests
	guest_name?: string | null;
	guest_email?: string | null;
	guest_phone?: string | null;
	created_at: string;
	updated_at: string;
	category?: { id: string; name: string };
	location_id?: string;
	location?: {
		id: string;
		latitude: number;
		longitude: number;
		address?: string;
		city?: string;
		state?: string;
		zip_code?: string;
		country?: string;
	};
	images?: string[];
	preferred_date?: string;
	urgency?: "low" | "medium" | "high" | "urgent";
	expiry_date?: string;
	view_count?: number;
	proposal_count?: number;
	deleted_at?: string;
}

export interface CreateRequestData {
	category_id: string;
	description: string;
	budget: number;
	location?: {
		latitude: number;
		longitude: number;
		address?: string;
		city?: string;
		state?: string;
		zipCode?: string;
		country?: string;
	};
	images?: string[];
	preferred_date?: string;
	urgency?: "low" | "medium" | "high" | "urgent";
	expiry_date?: string;
}

export interface UpdateRequestData {
	description?: string;
	budget?: number;
	status?: ServiceRequest["status"];
}

// Paginated response from API (standardized format)
export interface PaginatedResponse<T> {
	data: T[];
	total: number;
	cursor?: string;
	hasMore?: boolean;
}

export interface RequestFilters {
	status?: string;
	category_id?: string;
	min_budget?: number;
	max_budget?: number;
	cursor?: string;
	limit?: number;
	page?: number;
}

class RequestService {
	async createRequest(data: CreateRequestData): Promise<ServiceRequest> {
		const response = await apiClient.post<ServiceRequest>("/requests", data);
		return response.data;
	}

	async getRequests(filters?: RequestFilters): Promise<PaginatedResponse<ServiceRequest>> {
		const params = new URLSearchParams();
		if (filters?.status) params.append("status", filters.status);
		if (filters?.category_id) params.append("category_id", filters.category_id);
		if (filters?.min_budget) params.append("min_budget", filters.min_budget.toString());
		if (filters?.max_budget) params.append("max_budget", filters.max_budget.toString());
		if (filters?.cursor) params.append("cursor", filters.cursor);
		if (filters?.limit) params.append("limit", filters.limit.toString());

		const response = await apiClient.get<PaginatedResponse<ServiceRequest>>(`/requests?${params.toString()}`);
		// API client unwraps to { data, total } for responses with total
		return response.data;
	}

	async getRequestById(id: string): Promise<ServiceRequest> {
		const response = await apiClient.get<ServiceRequest>(`/requests/${id}`);
		// API client unwraps to just the data
		return response.data;
	}

	async updateRequest(id: string, data: UpdateRequestData): Promise<ServiceRequest> {
		const response = await apiClient.patch<ServiceRequest>(`/requests/${id}`, data);
		return response.data;
	}

	async cancelRequest(id: string): Promise<ServiceRequest> {
		const response = await apiClient.patch<ServiceRequest>(`/requests/${id}`, { status: "cancelled" });
		return response.data;
	}

	async getMyRequests(): Promise<ServiceRequest[]> {
		const response = await apiClient.get<any>(`/requests/my`);
		return apiClient.extractList<ServiceRequest>(response.data);
	}

	async getCategories(): Promise<ServiceCategory[]> {
		const response = await apiClient.get<ServiceCategory[]>("/categories");
		return apiClient.extractList<ServiceCategory>(response.data);
	}
}

export const requestService = new RequestService();
