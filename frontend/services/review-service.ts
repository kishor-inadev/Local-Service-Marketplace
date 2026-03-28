import { apiClient } from './api-client';

// Helper: Safely extract list from various response shapes
function extractList<T>(payload: any): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && Array.isArray(payload.data)) return payload.data as T[];
  return [];
}

// ------------------ Types ------------------

export interface Review {
  id: string;
  job_id: string;
  user_id: string;
  provider_id: string;
  rating: number;
  comment: string;
  created_at: string;
  response?: string;
  response_at?: string;
  helpful_count?: number;
  verified_purchase?: boolean;
}

export interface CreateReviewData {
  job_id: string;
  user_id: string;
  provider_id: string;
  rating: number;
  comment: string;
}

export interface ReviewWithDetails extends Review {
  customer_name?: string;
  customer_email?: string;
  job_title?: string;
}

// ------------------ API Methods ------------------

/**
 * Create a review after job completion
 */
export const createReview = async (data: CreateReviewData): Promise<Review> => {
  const response = await apiClient.post<Review>('/reviews', data);
  return response.data;
};

/**
 * Get reviews for a provider
 */
export const getProviderReviews = async (providerId: string): Promise<ReviewWithDetails[]> => {
  const response = await apiClient.get<ReviewWithDetails[]>(`/reviews/provider/${providerId}`);
  // Use defensive extraction: handles both array and nested object formats
  return extractList<ReviewWithDetails>(response.data);
};

/**
 * Get a specific review by ID
 */
export const getReview = async (reviewId: string): Promise<Review> => {
  const response = await apiClient.get<Review>(`/reviews/${reviewId}`);
  return response.data;
};

/**
 * Get reviews for a job
 */
export const getJobReview = async (jobId: string): Promise<Review | null> => {
  const response = await apiClient.get<Review>(`/reviews/jobs/${jobId}/review`);
  return response.data;
};

// ------------------ Review Aggregates ------------------

export interface ReviewAggregate {
  provider_id: string;
  total_reviews: number;
  average_rating: number;
  five_star_count: number;  // Transformed from rating_5_count
  four_star_count: number;  // Transformed from rating_4_count
  three_star_count: number;  // Transformed from rating_3_count
  two_star_count: number;  // Transformed from rating_2_count
  one_star_count: number;  // Transformed from rating_1_count
  last_review_at?: string;
  updated_at?: string;  // From database updated_at
}

/**
 * Get review aggregates for a provider
 */
export const getProviderReviewAggregates = async (providerId: string): Promise<ReviewAggregate> => {
  const response = await apiClient.get<ReviewAggregate>(
    `/review-aggregates/provider/${providerId}`
  );
  return response.data;
};

const reviewService = {
  createReview,
  getProviderReviews,
  getReview,
  getJobReview,
  getProviderReviewAggregates,
};

export default reviewService;
