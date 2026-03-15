/**
 * API utility for making requests to the API Gateway
 */

const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:3000';

interface ApiOptions extends RequestInit {
  token?: string;
}

/**
 * Make an API request to the API Gateway
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<{ data?: T; error?: string; status: number }> {
  const { token, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    ...(fetchOptions.headers as Record<string, string>),
  };

  // Add authorization header if token is provided
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Add Content-Type for JSON requests (unless it's FormData)
  if (fetchOptions.body && !(fetchOptions.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(`${API_GATEWAY_URL}${endpoint}`, {
      ...fetchOptions,
      headers,
    });

    let responseData;
    try {
      responseData = await response.json();
    } catch {
      responseData = null;
    }

    if (!response.ok) {
      // Handle standardized error response: { success: false, error: { message, code } }
      const errorMessage = responseData?.error?.message || 
                          responseData?.message || 
                          responseData?.error || 
                          'Request failed';
      return {
        error: errorMessage,
        status: response.status,
      };
    }

    // Handle standardized success response: { success: true, data, total? }
    // Unwrap data from standardized format
    const unwrappedData = responseData?.data !== undefined ? responseData.data : responseData;
    
    return {
      data: unwrappedData,
      status: response.status,
    };
  } catch (error) {
    console.error('API request error:', error);
    return {
      error: 'Network error',
      status: 0,
    };
  }
}

/**
 * Get auth token from cookies or localStorage
 * Note: This is a placeholder - implement based on your auth strategy
 */
export function getAuthToken(): string | null {
  // For now, return null - this should be implemented based on auth strategy
  // Options:
  // 1. Read from cookie: document.cookie
  // 2. Read from localStorage: localStorage.getItem('auth_token')
  // 3. Use a React context/hook for auth state
  
  if (typeof window === 'undefined') return null;
  
  // Example: reading from localStorage
  return localStorage.getItem('auth_token');
}
