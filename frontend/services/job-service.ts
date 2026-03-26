import { apiClient } from './api-client';

export interface Job {
	id: string;
	request_id: string;
	proposal_id?: string;
	customer_id: string;
	provider_id: string;
	status: "scheduled" | "in_progress" | "completed" | "cancelled" | "disputed";
	started_at?: string;
	completed_at?: string;
	created_at: string;
	updated_at: string;
	request?: { id?: string; description?: string };
	proposal?: { id?: string; message?: string };
	provider?: { id?: string; business_name?: string; rating?: number; user?: { name?: string } };
	customer?: { id?: string; name?: string; email?: string };
	actual_amount?: number;
	cancelled_by?: string;
	cancellation_reason?: string;
}

export interface CreateJobData {
  request_id: string;
  proposal_id: string;
  provider_id: string;
  customer_id: string;
  actual_amount?: number;
}

export interface UpdateJobStatusData {
  status: Job['status'];
  notes?: string;
}

class JobService {
  async createJob(data: CreateJobData): Promise<Job> {
    const response = await apiClient.post<Job>('/jobs', data);
    return response.data;
  }

  async getJobById(id: string): Promise<Job> {
    const response = await apiClient.get<Job>(`/jobs/${id}`);
    return response.data;
  }

  async updateJobStatus(
    id: string,
    data: UpdateJobStatusData,
  ): Promise<Job> {
    const response = await apiClient.patch<Job>(`/jobs/${id}/status`, data);
    return response.data;
  }

  async startJob(id: string): Promise<Job> {
    const response = await apiClient.patch<Job>(`/jobs/${id}/status`, {
      status: 'in_progress',
    });
    return response.data;
  }

  async completeJob(id: string): Promise<Job> {
    const response = await apiClient.patch<Job>(`/jobs/${id}/status`, {
      status: 'completed',
    });
    return response.data;
  }

  async cancelJob(id: string, reason?: string): Promise<Job> {
    const response = await apiClient.patch<Job>(`/jobs/${id}/status`, {
      status: 'cancelled',
      notes: reason,
    });
    return response.data;
  }

  async getMyJobs(): Promise<Job[]> {
    // Get current user from auth state
    const authState = JSON.parse(localStorage.getItem('auth-storage') || '{}');
    const userId = authState?.state?.user?.id;
    
    if (!userId) {
      throw new Error('User not authenticated');
    }
    
    const response = await apiClient.get<Job[]>(`/jobs/my?user_id=${userId}`);
    // API returns standardized format with { data: [], total: 0 }
    // API client unwraps it to { data, total } for responses with total
    return response.data || [];
  }

  async getJobsByStatus(status: Job['status']): Promise<Job[]> {
    const response = await apiClient.get<Job[]>(`/jobs?status=${status}`);
    // For array responses with total
    return response.data || [];
  }
}

export const jobService = new JobService();
