import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3500';

// Standardized API Response interface
interface StandardResponse<T = any> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  total?: number;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
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
  private isRefreshing = false;
  private refreshSubscribers: ((token: string) => void)[] = [];

  constructor() {
    this.client = axios.create({
      baseURL: `${API_URL}/api/v1`, // Added /api/v1 prefix
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // Include cookies in requests
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - add Authorization header
    this.client.interceptors.request.use(
      (config) => {
        // Add Authorization header with token from localStorage
        const token = this.getToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      },
    );

    // Response interceptor - unwrap standardized response and handle errors
    this.client.interceptors.response.use(
      (response) => {
        // Check if response follows the standardized format
        if (response.data && typeof response.data === 'object' && 'success' in response.data) {
          const standardResponse = response.data as StandardResponse;
          
          // For successful responses, unwrap the data field
          if (standardResponse.success) {
            // If there's a total count (for paginated/array responses), preserve it
            if (standardResponse.total !== undefined) {
              // For paginated responses, return object with data and total
              response.data = {
                data: standardResponse.data,
                total: standardResponse.total
              };
            } else {
              // For non-paginated responses, just return the data
              response.data = standardResponse.data;
            }
          } else {
            // Error response in standardized format
            // Keep the full error response for error handler
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
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        // Handle 401 Unauthorized - attempt token refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // Wait for the token refresh to complete
            return new Promise((resolve) => {
              this.refreshSubscribers.push(() => {
                // Retry the original request (cookie will be updated)
                resolve(this.client(originalRequest));
              });
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const refreshToken = this.getRefreshToken();
            if (refreshToken) {
              const response = await this.client.post('/auth/refresh', { refreshToken });
              
              // New access token is automatically set in cookie by backend
              // No need to manually store it
              
              // Notify all subscribers
              this.refreshSubscribers.forEach((callback) => callback('refreshed'));
              this.refreshSubscribers = [];
              
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, logout user
            this.logout();
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        this.handleError(error);
        return Promise.reject(error);
      },
    );
  }

  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('access_token');
    }
    return null;
  }

  private getRefreshToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('refresh_token');
    }
    return null;
  }

  private setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', token);
    }
  }

  private removeToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  }

  private logout(): void {
    if (typeof window !== 'undefined') {
      // Tokens are now in HTTP-only cookies, cleared by backend
      // Just redirect to login
      window.location.href = '/login';
    }
  }

  private handleError(error: AxiosError<ApiErrorResponse>) {
    if (error.response) {
      const { status, data } = error.response;
      
      // Handle standardized error format
      let message = 'An error occurred';
      
      if (data?.error) {
        // Standardized error format: { success: false, error: { code, message, details } }
        message = data.error.message;
      } else if (Array.isArray(data?.message)) {
        // NestJS validation errors
        message = data.message.join(', ');
      } else if (typeof data?.message === 'string') {
        message = data.message;
      }

      switch (status) {
        case 401:
          // Don't show toast for 401 during token refresh
          if (!message.toLowerCase().includes('refresh')) {
            toast.error('Unauthorized. Please login again.');
          }
          break;
        case 403:
          toast.error('Access forbidden.');
          break;
        case 404:
          toast.error('Resource not found.');
          break;
        case 409:
          toast.error(message || 'Conflict. Resource already exists.');
          break;
        case 422:
          toast.error(message || 'Validation error.');
          break;
        case 429:
          toast.error('Too many requests. Please try again later.');
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          toast.error('Server error. Please try again later.');
          break;
        default:
          toast.error(message);
      }
    } else if (error.request) {
      toast.error('Network error. Please check your connection.');
    } else {
      toast.error('An unexpected error occurred.');
    }
  }

  // HTTP Methods with proper return types
  public get<T = any>(url: string, config?: AxiosRequestConfig) {
    return this.client.get<T>(url, config);
  }

  public post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ) {
    return this.client.post<T>(url, data, config);
  }

  public put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ) {
    return this.client.put<T>(url, data, config);
  }

  public patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ) {
    return this.client.patch<T>(url, data, config);
  }

  public delete<T = any>(url: string, config?: AxiosRequestConfig) {
    return this.client.delete<T>(url, config);
  }

  // Utility method to create abort controller for cancellable requests
  public createAbortController(): AbortController {
    return new AbortController();
  }
}

export const apiClient = new ApiClient();
export default apiClient;
