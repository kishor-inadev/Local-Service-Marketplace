import { apiClient } from './api-client';

// ------------------ Types ------------------

export interface UserProfile {
  id: string;
  email: string;
  phone?: string;
  role: 'customer' | 'provider' | 'admin';
  email_verified: boolean;
  status: string;
  created_at: string;
  updated_at?: string;
  profile_picture_url?: string;
  timezone?: string;
  language?: string;
  phone_verified?: boolean;
  last_login_at?: string;
  deleted_at?: string;
}

export interface UpdateProfileData {
  phone?: string;
  email?: string;
}

export interface ProviderProfile {
  id: string;
  user_id: string;
  business_name: string;
  description: string;
  rating?: number;
  created_at: string;
  services?: Array<{ id: string; category_id: string }>;
  availability?: Array<{
    id: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
  }>;
  verification_status?: 'pending' | 'verified' | 'rejected';
  certifications?: any;
  years_of_experience?: number;
  service_area_radius?: number;
  response_time_avg?: number;
  total_jobs_completed?: number;
  profile_picture_url?: string;
  deleted_at?: string;
}

export interface CreateProviderData {
  business_name: string;
  description: string;
}

export interface UpdateProviderData {
  business_name?: string;
  description?: string;
}

export interface ProviderService {
  id: string;
  provider_id: string;
  category_id: string;
  service_name?: string;
  description?: string;
}

export interface UpdateProviderServicesData {
  services: Array<{
    category_id: string;
    service_name?: string;
    description?: string;
  }>;
}

// ------------------ API Methods ------------------

/**
 * Get current user profile
 */
export const getUserProfile = async (): Promise<UserProfile> => {
  const response = await apiClient.get<UserProfile>('/users/me');
  return response.data;
};

/**
 * Update current user profile
 */
export const updateUserProfile = async (data: UpdateProfileData): Promise<UserProfile> => {
  const response = await apiClient.patch<UserProfile>('/users/me', data);
  return response.data;
};

/**
 * Create provider profile
 */
export const createProviderProfile = async (data: CreateProviderData): Promise<ProviderProfile> => {
  const response = await apiClient.post<ProviderProfile>('/providers', data);
  return response.data;
};

/**
 * Update provider profile
 */
export const updateProviderProfile = async (
  providerId: string,
  data: UpdateProviderData
): Promise<ProviderProfile> => {
  const response = await apiClient.patch<ProviderProfile>(`/providers/${providerId}`, data);
  return response.data;
};

/**
 * Get provider profile
 */
export const getProviderProfile = async (providerId: string): Promise<ProviderProfile> => {
  const response = await apiClient.get<ProviderProfile>(`/providers/${providerId}`);
  return response.data;
};

/**
 * List provider services
 */
export const getProviderServices = async (providerId: string): Promise<ProviderService[]> => {
  const response = await apiClient.get<ProviderService[]>(`/providers/${providerId}/services`);
  // API client unwraps standardized response
  return response.data || [];
};

/**
 * Update provider services
 */
export const updateProviderServices = async (
  providerId: string,
  data: UpdateProviderServicesData
): Promise<ProviderService[]> => {
  const response = await apiClient.put<ProviderService[]>(
    `/providers/${providerId}/services`,
    data
  );
  // API client unwraps standardized response
  return response.data || [];
};

/**
 * Get all providers with pagination and filters
 */
export const getProviders = async (params?: {
  limit?: number;
  cursor?: string;
  category_id?: string;
  search?: string;
  location_id?: string;
}): Promise<{ data: ProviderProfile[]; hasMore: boolean; nextCursor?: string }> => {
  const queryParams = new URLSearchParams();
  
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.cursor) queryParams.append('cursor', params.cursor);
  if (params?.category_id) queryParams.append('category_id', params.category_id);
  if (params?.search) queryParams.append('search', params.search);
  if (params?.location_id) queryParams.append('location_id', params.location_id);

  const response = await apiClient.get<{ data: ProviderProfile[]; hasMore: boolean; nextCursor?: string }>(
    `/providers?${queryParams.toString()}`
  );
  return response.data;
};

// ------------------ Provider Documents ------------------

export interface ProviderDocument {
  id: string;
  provider_id: string;
  document_type: 'government_id' | 'business_license' | 'insurance_certificate' | 'certification' | 'tax_document';
  document_url: string;
  document_name: string;
  document_number?: string;
  expiry_date?: string;  // Maps to expires_at in database
  verified: boolean;
  rejected: boolean;
  rejection_reason?: string;
  verified_by?: string;
  verified_at?: string;
  created_at: string;
}

export interface UploadDocumentData {
  document_type: string;
  file: File;
  document_number?: string;
  expiry_date?: string;
}

export interface VerificationStatus {
  fully_verified: boolean;
  verified_count: number;
  pending_count: number;
  missing_required_count: number;
  missing_required_types: string[];
}

/**
 * Upload provider document
 */
export const uploadProviderDocument = async (
  providerId: string,
  data: UploadDocumentData
): Promise<ProviderDocument> => {
  const formData = new FormData();
  formData.append('file', data.file);
  formData.append('document_type', data.document_type);
  if (data.document_number) formData.append('document_number', data.document_number);
  if (data.expiry_date) formData.append('expiry_date', data.expiry_date);

  const response = await apiClient.post<ProviderDocument>(
    `/provider-documents/upload/${providerId}`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' }
    }
  );
  return response.data;
};

/**
 * Get provider documents
 */
export const getProviderDocuments = async (providerId: string): Promise<ProviderDocument[]> => {
  const response = await apiClient.get<ProviderDocument[]>(`/provider-documents/provider/${providerId}`);
  // API client unwraps standardized response
  return response.data || [];
};

/**
 * Get document verification status
 */
export const getDocumentVerificationStatus = async (
  providerId: string
): Promise<VerificationStatus> => {
  const response = await apiClient.get<VerificationStatus>(
    `/provider-documents/verification-status/${providerId}`
  );
  return response.data;
};

/**
 * Delete provider document
 */
export const deleteProviderDocument = async (
  providerId: string,
  documentId: string
): Promise<void> => {
  await apiClient.delete(`/provider-documents/${documentId}`);
};

// ------------------ Provider Portfolio ------------------

export interface PortfolioItem {
  id: string;
  provider_id: string;
  title: string;
  description?: string;
  images: string[];  // Transformed from image_url
  display_order: number;
  created_at: string;
}

export interface CreatePortfolioData {
  title: string;
  description?: string;
  images: File[];
}

export interface UpdatePortfolioData {
  title?: string;
  description?: string;
}

/**
 * Create portfolio item
 */
export const createPortfolioItem = async (
  providerId: string,
  data: CreatePortfolioData
): Promise<PortfolioItem> => {
  const formData = new FormData();
  formData.append('title', data.title);
  if (data.description) formData.append('description', data.description);
  data.images.forEach((image) => formData.append('images', image));

  const response = await apiClient.post<PortfolioItem>(
    `/provider-portfolio/${providerId}`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' }
    }
  );
  return response.data;
};

/**
 * Get provider portfolio
 */
export const getProviderPortfolio = async (providerId: string): Promise<PortfolioItem[]> => {
  const response = await apiClient.get<PortfolioItem[]>(`/provider-portfolio/provider/${providerId}`);
  // API client unwraps standardized response
  return response.data || [];
};

/**
 * Update portfolio item
 */
export const updatePortfolioItem = async (
  providerId: string,
  itemId: string,
  data: UpdatePortfolioData
): Promise<PortfolioItem> => {
  const response = await apiClient.put<PortfolioItem>(
    `/provider-portfolio/${itemId}`,
    data
  );
  return response.data;
};

/**
 * Delete portfolio item
 */
export const deletePortfolioItem = async (
  providerId: string,
  itemId: string
): Promise<void> => {
  await apiClient.delete(`/provider-portfolio/${itemId}`);
};

/**
 * Reorder portfolio items
 */
export const reorderPortfolio = async (
  providerId: string,
  orderedIds: string[]
): Promise<void> => {
  await apiClient.put(`/provider-portfolio/${providerId}/reorder`, { ordered_ids: orderedIds });
};

const userService = {
  getUserProfile,
  updateUserProfile,
  createProviderProfile,
  updateProviderProfile,
  getProviderProfile,
  getProviders,
  getProviderServices,
  updateProviderServices,
  uploadProviderDocument,
  getProviderDocuments,
  getDocumentVerificationStatus,
  deleteProviderDocument,
  createPortfolioItem,
  getProviderPortfolio,
  updatePortfolioItem,
  deletePortfolioItem,
  reorderPortfolio,
};

export default userService;
