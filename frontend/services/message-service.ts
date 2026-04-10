import { apiClient } from './api-client';

function extractList<T>(payload: any): T[] {
	if (Array.isArray(payload)) return payload as T[];
	if (payload && Array.isArray(payload.data)) return payload.data as T[];
	return [];
}

export interface Message {
  id: string;
  display_id?: string;
  job_id: string;
  sender_id: string;
  message: string;
  attachments?: Attachment[];
  created_at: string;
  sender?: {
    id: string;
    name: string;
  };
  read?: boolean;
  read_at?: string;
  edited?: boolean;
  edited_at?: string;
}

export interface Attachment {
  id: string;
  message_id: string;
  file_name: string;
  file_url: string;
  file_size: number;
  mime_type: string;
  created_at: string;
}

export interface Conversation {
	job_id: string;
	last_message?: string;
	last_message_at?: string;
	unread_count?: number;
	participant?: { id: string; name?: string };
}

export interface SendMessageData {
	job_id: string;
	message: string;
}

class MessageService {
  async sendMessage(data: SendMessageData): Promise<Message> {
    const response = await apiClient.post<Message>("/messages", { job_id: data.job_id, message: data.message });
    return response.data;
  }

  async getMessagesByJob(jobId: string): Promise<Message[]> {
    const response = await apiClient.get<Message[]>(`/messages/jobs/${jobId}`);
    return extractList<Message>(response.data);
  }

  async getConversations(): Promise<Conversation[]> {
    const response = await apiClient.get<Conversation[]>('/messages/conversations');
    return extractList<Conversation>(response.data);
  }

  async markAsRead(messageId: string): Promise<void> {
    const response = await apiClient.patch<void>(`/messages/${messageId}/read`, {});
    return response.data;
  }
}

export const messageService = new MessageService();
