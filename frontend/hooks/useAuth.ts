'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export function useAuth() {
  const router = useRouter();
  const {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    signup,
    logout,
    checkAuth,
    setToken,
  } = useAuthStore();

  // Check auth only once on mount (not on every checkAuth function change)
  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requireAuth = () => {
    if (!isAuthenticated && !isLoading) {
      router.push('/login');
    }
  };

  const requireRole = (roles: string[]) => {
    if (!isAuthenticated || !user) {
      router.push('/login');
      return false;
    }
    if (!roles.includes(user.role)) {
      router.push('/dashboard');
      return false;
    }
    return true;
  };

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    signup,
    logout,
    requireAuth,
    requireRole,
    setToken,
  };
}
