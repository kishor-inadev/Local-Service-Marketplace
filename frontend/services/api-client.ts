import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { getSession } from 'next-auth/react';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3700";

// Deduplicate concurrent getSession() calls: all requests that fire at the same
// time share a single in-flight session fetch instead of triggering N refreshes.
let _sessionPromise: Promise<Awaited<ReturnType<typeof getSession>>> | null = null;

function getSessionOnce() {
  if (!_sessionPromise) {
    _sessionPromise = getSession().finally(() => {
      _sessionPromise = null;
    });
  }
  return _sessionPromise;
}

// Standardized API Response interface
interface StandardResponse<T = any> {
	success: boolean;
	statusCode: number;
	message: string;
	data?: T;
	meta?: { page: number; limit: number; total: number; totalPages: number } | null;
	error?: { code: string; message: string; details?: any };
}

// Legacy API Error Response interface (for backward compatibility)
interface ApiErrorResponse {
  success?: boolean;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  message?: string | string[]; // NestJS validation errors
  statusCode?: number;
  timestamp?: string;
  path?: string;
}

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `${API_URL}/api/v1`,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // Include HTTP-only cookies
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - add Authorization header from NextAuth session
    this.client.interceptors.request.use(
			async (config) => {
				// Get the current session (deduplicating concurrent calls)
				const session = await getSessionOnce();
				if (session?.accessToken && config.headers) {
					config.headers.Authorization = `Bearer ${session.accessToken}`;
				}
				return config;
			},
			(error) => Promise.reject(error),
		);

    // Response interceptor - unwrap standardized response and handle errors
    this.client.interceptors.response.use(
      (response) => {
        // Check if response follows the standardized format
        if (response.data && typeof response.data === 'object' && 'success' in response.data) {
          const standardResponse = response.data as StandardResponse;
          
          // For successful responses, unwrap the data field
          if (standardResponse.success) {
						// If there's pagination metadata, preserve it alongside data
						if (standardResponse.meta != null) {
							// For paginated responses, return object with data and meta fields
							response.data = {
								data: standardResponse.data,
								total: standardResponse.meta.total,
								page: standardResponse.meta.page,
								limit: standardResponse.meta.limit,
								totalPages: standardResponse.meta.totalPages,
							};
						} else {
							// For non-paginated responses, just return the data
							response.data = standardResponse.data;
						}
					} else {
            // Error response in standardized format
            return Promise.reject({
              response: {
                status: standardResponse.statusCode,
                data: standardResponse
              }
            });
          }
        }
        return response;
      },
      async (error: AxiosError<ApiErrorResponse>) => {
        // Handle 401 Unauthorized
        // Note: Token refresh is handled automatically by NextAuth
        // If we get a 401, the session is invalid or refresh failed
        if (error.response?.status === 401) {
					// Check if session has expired (reuse in-flight session fetch)
					const session = await getSessionOnce();

					if (!session || session.error === "RefreshAccessTokenError") {
						// Session is invalid or refresh failed
						// The useAuth hook will handle logout via useEffect
						console.error("Session expired or invalid");
					}
				}

        this.handleError(error);
        return Promise.reject(error);
      },
    );
  }

  private handleError(error: AxiosError<ApiErrorResponse>) {
    // Handle network errors
    if (!error.response) {
      toast.error('Network error. Please check your connection.');
      return;
    }

    const { status, data } = error.response;

    // Extract error message from standardized or legacy format
    let errorMessage = 'An error occurred';
    
    if (data?.error?.message) {
      errorMessage = data.error.message;
    } else if (Array.isArray(data?.message)) {
      errorMessage = data.message.join(', ');
    } else if (typeof data?.message === 'string') {
      errorMessage = data.message;
    }

    // Handle specific status codes
    switch (status) {
      case 400:
        toast.error(`Validation Error: ${errorMessage}`);
        break;
      case 401:
        toast.error('Session expired. Please log in again.');
        break;
      case 403:
        toast.error('Access Denied');
        break;
      case 404:
        toast.error('Resource not found');
        break;
      case 409:
        toast.error(errorMessage);
        break;
      case 422:
        toast.error(`Validation Error: ${errorMessage}`);
        break;
      case 429:
        toast.error('Too many requests. Please try again later.');
        break;
      case 500:
        toast.error('Internal Server Error. Please try again.');
        break;
      default:
        toast.error(errorMessage);
    }
  }

  // Public HTTP methods
  async get<T = any>(url: string, config?: AxiosRequestConfig) {
    return this.client.get<T>(url, config);
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.client.post<T>(url, data, config);
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.client.put<T>(url, data, config);
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.client.patch<T>(url, data, config);
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig) {
    return this.client.delete<T>(url, config);
  }
}

export const apiClient = new ApiClient();
