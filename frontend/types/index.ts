// Re-export common types from services for convenience
export type {
  SignupData,
  LoginData,
  AuthResponse,
} from '@/services/auth-service';

export type {
  ServiceRequest,
  CreateRequestData,
  UpdateRequestData,
  PaginatedResponse,
  RequestFilters,
} from '@/services/request-service';

export type {
  Proposal,
  CreateProposalData,
  UpdateProposalData,
} from '@/services/proposal-service';

export type { Job, CreateJobData, UpdateJobStatusData } from '@/services/job-service';

export type { Payment, CreatePaymentData, RefundData } from '@/services/payment-service';

export type {
  Message,
  Attachment,
  SendMessageData,
} from '@/services/message-service';

export type {
  Notification,
  NotificationFilters,
} from '@/services/notification-service';

export type { User, Dispute, AuditLog } from '@/services/admin-service';

// Additional UI types
export interface SelectOption {
  value: string;
  label: string;
}

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export type UserRole = 'customer' | 'provider' | 'admin';

export type RequestStatus = 'open' | 'assigned' | 'completed' | 'cancelled';

export type JobStatus =
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'disputed';

export type ProposalStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';

export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'refunded';
