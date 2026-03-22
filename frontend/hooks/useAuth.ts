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
      // Return error for component to handle
      throw new Error(result.error);
    }

    if (!result?.ok) {
      throw new Error('Login failed. Please check your credentials.');
    }

    // Let the component handle success message and redirect
    return result;
  };

  const loginWithPhone = async (phone: string, password: string) => {
    const result = await signIn('phone-password', {
      phone,
      password,
      redirect: false,
    });

    if (result?.error) {
      throw new Error(result.error);
    }

    if (!result?.ok) {
      throw new Error('Phone login failed. Please check your credentials.');
    }

    return result;
  };

  const loginWithOTP = async (phone: string, otp: string) => {
    const result = await signIn('phone-otp', {
      phone,
      otp,
      redirect: false,
    });

    if (result?.error) {
      throw new Error(result.error);
    }

    if (!result?.ok) {
      throw new Error('OTP verification failed. Please check your code.');
    }

    return result;
  };

  const requestOTP = async (phone: string) => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3500';
    const response = await fetch(`${API_URL}/api/v1/user/auth/phone/otp/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone }),
    });

    if (!response.ok) {
      throw new Error('Failed to send OTP. Please try again.');
    }

    const data = await response.json();
    return data;
  };

  const requestEmailOTP = async (email: string) => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3500';
    const response = await fetch(`${API_URL}/api/v1/user/auth/email/otp/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      throw new Error('Failed to send OTP. Please try again.');
    }

    const data = await response.json();
    return data;
  };

  const loginWithEmailOTP = async (email: string, otp: string) => {
    const result = await signIn('email-otp', {
      email,
      otp,
      redirect: false,
    });

    if (result?.error) {
      throw new Error(result.error);
    }

    if (!result?.ok) {
      throw new Error('OTP verification failed. Please check your code.');
    }

    return result;
  };

  const loginWithGoogle = () => {
    // Redirect to backend OAuth endpoint
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3500';
    window.location.href = `${API_URL}/api/v1/user/auth/google`;
  };

  const loginWithFacebook = () => {
    // Redirect to backend OAuth endpoint
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3500';
    window.location.href = `${API_URL}/api/v1/user/auth/facebook`;
  };

  const signup = async (data: SignupData) => {
    // Call backend signup endpoint
    const response = await authService.signup(data);

    // After successful signup, automatically sign in
    const signInResult = await signIn('credentials', {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (!signInResult?.ok) {
      throw new Error('Account created but auto-login failed. Please log in manually.');
    }

    // Let component handle success and redirect
    return response;
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
    // Session state
    user,
    session,
    isLoading,
    isAuthenticated,

    // Email/Password auth
    login,
    signup,
    logout,

    // Phone auth
    loginWithPhone,
    loginWithOTP,
    requestOTP,

    // Email OTP auth
    loginWithEmailOTP,
    requestEmailOTP,

    // OAuth
    loginWithGoogle,
    loginWithFacebook,

    // Utilities
    requireAuth,
    requireRole,
    updateSession: update,

    // Debugging
    tokenExpires: session?.accessTokenExpires,
    hasTokenError: session?.error === "RefreshAccessTokenError",
  };
}
