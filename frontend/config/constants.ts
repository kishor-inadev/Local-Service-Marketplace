// Application-wide constants and configuration

export const APP_CONFIG = {
  // Pagination
  PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  
  // File uploads
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  
  // UI
  DEBOUNCE_DELAY: 300, // ms
  TOAST_DURATION: 3000, // ms
  
  // Cache
  QUERY_STALE_TIME: 5 * 60 * 1000, // 5 minutes
  QUERY_CACHE_TIME: 10 * 60 * 1000, // 10 minutes
} as const;

export const ROUTES = {
  // Public
  HOME: '/',
  
  // Auth
  LOGIN: '/login',
  SIGNUP: '/signup',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  VERIFY_EMAIL: '/auth/verify-email',
  CALLBACK: '/auth/callback',
  
  // Dashboard
  DASHBOARD: '/dashboard',
  
  // Providers
  PROVIDERS: '/providers',
  PROVIDER_DETAIL: (id: string) => `/providers/${id}`,
  
  // Requests
  REQUESTS: '/requests',
  REQUEST_DETAIL: (id: string) => `/requests/${id}`,
  CREATE_REQUEST: '/requests/create',
  
  // Jobs
  JOBS: '/jobs',
  JOB_DETAIL: (id: string) => `/jobs/${id}`,
  
  // Messages
  MESSAGES: '/messages',
  
  // Notifications
  NOTIFICATIONS: '/notifications',
  
  // Admin
  ADMIN: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_DISPUTES: '/admin/disputes',
  ADMIN_SETTINGS: '/admin/settings',
} as const;

export const API_ENDPOINTS = {
  // Auth
  AUTH: '/auth',
  LOGIN: '/auth/login',
  SIGNUP: '/auth/signup',
  LOGOUT: '/auth/logout',
  REFRESH: '/auth/refresh',
  VERIFY_EMAIL: '/auth/verify-email',
  RESET_PASSWORD: '/auth/reset-password',
  
  // Users
  USERS: '/users',
  USER_PROFILE: '/users/me',
  
  // Providers
  PROVIDERS: '/providers',
  PROVIDER_SERVICES: (id: string) => `/providers/${id}/services`,
  PROVIDER_AVAILABILITY: (id: string) => `/providers/${id}/availability`,
  
  // Requests
  REQUESTS: '/requests',
  REQUEST_BY_ID: (id: string) => `/requests/${id}`,
  CANCEL_REQUEST: (id: string) => `/requests/${id}/cancel`,
  
  // Proposals
  PROPOSALS: '/proposals',
  PROPOSAL_BY_ID: (id: string) => `/proposals/${id}`,
  ACCEPT_PROPOSAL: (id: string) => `/proposals/${id}/accept`,
  REJECT_PROPOSAL: (id: string) => `/proposals/${id}/reject`,
  REQUEST_PROPOSALS: (requestId: string) => `/requests/${requestId}/proposals`,
  
  // Jobs
  JOBS: '/jobs',
  JOB_BY_ID: (id: string) => `/jobs/${id}`,
  START_JOB: (id: string) => `/jobs/${id}/start`,
  COMPLETE_JOB: (id: string) => `/jobs/${id}/complete`,
  
  // Payments
  PAYMENTS: '/payments',
  CREATE_PAYMENT: '/payments',
  REFUND: (id: string) => `/payments/${id}/refund`,
  
  // Messages
  MESSAGES: '/messages',
  SEND_MESSAGE: '/messages',
  
  // Notifications
  NOTIFICATIONS: '/notifications',
  MARK_READ: (id: string) => `/notifications/${id}/read`,
  MARK_ALL_READ: '/notifications/read-all',
  
  // Reviews
  REVIEWS: '/reviews',
  CREATE_REVIEW: '/reviews',
  
  // Admin
  ADMIN_USERS: '/admin/users',
  ADMIN_DISPUTES: '/admin/disputes',
  ADMIN_AUDIT_LOGS: '/admin/audit-logs',
} as const;

export const REQUEST_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export const PROPOSAL_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
} as const;

export const JOB_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;

export const USER_ROLES = {
  CUSTOMER: 'customer',
  PROVIDER: 'provider',
  ADMIN: 'admin',
} as const;

export const NOTIFICATION_TYPES = {
  NEW_PROPOSAL: 'new_proposal',
  PROPOSAL_ACCEPTED: 'proposal_accepted',
  PROPOSAL_REJECTED: 'proposal_rejected',
  JOB_STARTED: 'job_started',
  JOB_COMPLETED: 'job_completed',
  PAYMENT_RECEIVED: 'payment_received',
  NEW_MESSAGE: 'new_message',
  NEW_REVIEW: 'new_review',
} as const;

export const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
] as const;
