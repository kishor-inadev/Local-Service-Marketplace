'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ROUTES } from '@/config/constants';
import { authService, SignupData } from '@/services/auth-service';
import toast from 'react-hot-toast';

export function useAuth() {
  const router = useRouter();
  const { data: session, status, update } = useSession();

  const isLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated';
  const user = session?.user;

  // Handle token refresh errors
  useEffect(() => {
    if (session?.error === "RefreshAccessTokenError") {
      // Token refresh failed - force logout
      toast.error('Session expired. Please log in again.');
      signOut({ redirect: false }).then(() => {
        router.push(ROUTES.LOGIN);
      });
    }
  }, [session?.error, router]);

  const login = async (email: string, password: string) => {
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      toast.error(result.error);
      throw new Error(result.error);
    }

    if (result?.ok) {
      toast.success('Login successful!');
      router.push(ROUTES.DASHBOARD);
    }
  };

  const signup = async (data: SignupData) => {
    try {
      // Call backend signup endpoint
      const response = await authService.signup(data);
      
      // After successful signup, automatically sign in
      await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      toast.success('Account created successfully!');
      router.push(ROUTES.DASHBOARD);
    } catch (error: any) {
      toast.error(error?.message || 'Signup failed');
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Call backend logout to invalidate session
      await authService.logout();
    } catch (error) {
      console.error('Backend logout error:', error);
    } finally {
      // NextAuth signOut handles client-side session cleanup
      await signOut({ redirect: false });
      toast.success('Logged out successfully');
      router.push(ROUTES.LOGIN);
    }
  };

  const requireAuth = () => {
    if (!isAuthenticated && !isLoading) {
      router.push(ROUTES.LOGIN);
    }
  };

  const requireRole = (roles: string[]) => {
    if (!isAuthenticated || !user) {
      router.push(ROUTES.LOGIN);
      return false;
    }
    if (!roles.includes(user.role)) {
      router.push(ROUTES.DASHBOARD);
      return false;
    }
    return true;
  };

  return {
    user,
    session,
    isAuthenticated,
    isLoading,
    login,
    signup,
    logout,
    requireAuth,
    requireRole,
    updateSession: update,
    // Expose token expiration for debugging
    tokenExpires: session?.accessTokenExpires,
    hasTokenError: session?.error === "RefreshAccessTokenError",
  };
}
