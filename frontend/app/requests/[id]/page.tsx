'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/config/constants';
import { Loading } from '@/components/ui/Loading';

export default function RequestDetailRedirectPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated, isLoading } = useAuth();
  const requestId = params.id as string;

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        // Redirect authenticated users to dashboard request detail
        router.replace(ROUTES.DASHBOARD_REQUEST_DETAIL(requestId));
      } else {
        // Redirect unauthenticated users to login
        router.replace(ROUTES.LOGIN);
      }
    }
  }, [isAuthenticated, isLoading, router, requestId]);

  return <Loading />;
}
