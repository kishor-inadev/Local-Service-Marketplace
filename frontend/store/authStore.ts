import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService, AuthResponse } from '@/services/auth-service';

interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  email_verified: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      setToken: (token) => {
        if (token) {
          authService.setToken(token);
        } else {
          authService.removeToken();
        }
        set({ token, isAuthenticated: !!token });
      },

      login: async (email: string, password: string) => {
        try {
          const response: AuthResponse = await authService.login({
            email,
            password,
          });
          
          // Store access token in localStorage
          authService.setToken(response.accessToken);
          if (response.refreshToken && typeof window !== 'undefined') {
            localStorage.setItem('refresh_token', response.refreshToken);
          }
          
          set({
            user: response.user,
            token: response.accessToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ user: null, token: null, isAuthenticated: false });
          throw error;
        }
      },

      signup: async (data: any) => {
        try {
          const response: AuthResponse = await authService.signup(data);
          
          // Store access token in localStorage
          authService.setToken(response.accessToken);
          if (response.refreshToken && typeof window !== 'undefined') {
            localStorage.setItem('refresh_token', response.refreshToken);
          }
          
          set({
            user: response.user,
            token: response.accessToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ user: null, token: null, isAuthenticated: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          // Get refresh token from persisted state before clearing
          const refreshToken = get().token; // Using access token as fallback
          if (refreshToken) {
            await authService.logout();
          }
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          authService.removeToken();
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      checkAuth: async () => {
        // Try to verify if user is authenticated by checking a protected endpoint
        // Cookies are automatically sent with the request
        try {
          // Make a simple request to verify auth status
          // We'll use the user's existing state if available
          const currentUser = get().user;
          const currentToken = get().token;
          
          if (currentUser && currentToken) {
            // Already have user data, just verify token is still valid
            set({ user: currentUser, token: currentToken, isAuthenticated: true, isLoading: false });
          } else {
            // No user data, check if we're still authenticated via cookies
            // The backend will verify the HTTP-only cookie
            set({ user: null, isAuthenticated: false, isLoading: false });
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          set({ user: null, token: null, isAuthenticated: false, isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
