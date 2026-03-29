/**
 * @deprecated This file is deprecated and should not be used.
 * 
 * Use the standardized API client and service modules instead:
 * - Import { apiClient } from '@/services/api-client' for direct API calls
 * - Or use specialized services from @/services/* (e.g., auth-service, user-service, etc.)
 * 
 * All API calls should go through the API Gateway using the apiClient,
 * which handles authentication, error handling, and standardized response formats.
 * 
 * Example migration:
 * 
 * OLD (utils/api.ts):
 *   const { data } = await apiRequest('/user/auth/me', { token });
 * 
 * NEW (services/user-service.ts):
 *   import { getUserProfile } from '@/services/user-service';
 *   const user = await getUserProfile();
 * 
 * Or direct API client usage:
 *   import { apiClient } from '@/services/api-client';
 *   const response = await apiClient.get('/user/auth/me');
 *   const user = response.data;
 */

export {};
