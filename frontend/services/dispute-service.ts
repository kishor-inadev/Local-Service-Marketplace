import { apiClient } from './api-client';

export interface Dispute {
  id: string;
  display_id?: string;
  job_id: string;
  opened_by: string;
  reason: string;
  description?: string;
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  resolution?: string;
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
  updated_at?: string;
  job?: { id: string; display_id?: string };
}

export interface CreateDisputeData {
  job_id: string;
  reason: string;
  description?: string;
}

class DisputeService {
  async createDispute(data: CreateDisputeData): Promise<Dispute> {
    const response = await apiClient.post<Dispute>('/disputes', data);
    return response.data;
  }

  async getMyDisputes(params?: { status?: string; page?: number; limit?: number }): Promise<{ data: Dispute[]; total: number }> {
    const qs = new URLSearchParams();
    if (params?.status) qs.append('status', params.status);
    if (params?.page) qs.append('page', String(params.page));
    if (params?.limit) qs.append('limit', String(params.limit));
    const response = await apiClient.get<any>(`/disputes/my?${qs.toString()}`);
    const raw = response.data;
    if (Array.isArray(raw)) return { data: raw, total: raw.length };
    return { data: raw?.data ?? [], total: raw?.total ?? 0 };
  }

  async getDisputeById(id: string): Promise<Dispute> {
    const response = await apiClient.get<Dispute>(`/disputes/${id}`);
    return response.data;
  }
}

export const disputeService = new DisputeService();
