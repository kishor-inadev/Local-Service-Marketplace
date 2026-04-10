import { apiClient } from "./api-client";

export interface Proposal {
	id: string;
	display_id?: string;
	request_id: string;
	provider_id: string;
	price: number;
	message: string;
	status: "pending" | "accepted" | "rejected" | "withdrawn";
	created_at: string;
	updated_at: string;
	provider?: { id: string; name: string; rating: number; review_count: number };
	estimated_hours?: number;
	start_date?: string;
	completion_date?: string;
	rejected_reason?: string;
}

export interface CreateProposalData {
	request_id: string;
	provider_id: string;
	price: number;
	message: string;
	estimated_hours?: number;
	start_date?: string;
	completion_date?: string;
}

export interface UpdateProposalData {
	price?: number;
	estimated_hours?: number;
	message?: string;
}

class ProposalService {
	async createProposal(data: CreateProposalData): Promise<Proposal> {
		const response = await apiClient.post<Proposal>("/proposals", data);
		return response.data;
	}

	async getProposalsByRequest(requestId: string): Promise<Proposal[]> {
		const response = await apiClient.get<any>(`/requests/${requestId}/proposals`);
		return apiClient.extractList<Proposal>(response.data);
	}

	async getProposalById(id: string): Promise<Proposal> {
		const response = await apiClient.get<Proposal>(`/proposals/${id}`);
		return response.data;
	}

	async updateProposal(id: string, data: UpdateProposalData): Promise<Proposal> {
		const response = await apiClient.patch<Proposal>(`/proposals/${id}`, data);
		return response.data;
	}

	async acceptProposal(id: string): Promise<Proposal> {
		const response = await apiClient.post<Proposal>(`/proposals/${id}/accept`, {});
		return response.data;
	}

	async rejectProposal(id: string): Promise<Proposal> {
		const response = await apiClient.post<Proposal>(`/proposals/${id}/reject`, {});
		return response.data;
	}

	async withdrawProposal(id: string): Promise<Proposal> {
		const response = await apiClient.post<Proposal>(`/proposals/${id}/withdraw`, {});
		return response.data;
	}

	async getMyProposals(): Promise<Proposal[]> {
		const response = await apiClient.get<any>(`/proposals/my`);
		return apiClient.extractList<Proposal>(response.data);
	}
}

export const proposalService = new ProposalService();
