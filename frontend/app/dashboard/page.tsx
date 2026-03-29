'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES, getDashboardHomeByRole } from "@/config/constants";
import { Loading } from '@/components/ui/Loading';
import { analytics } from "@/utils/analytics";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(ROUTES.LOGIN);
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
		if (isAuthenticated && user?.role) {
			router.replace(getDashboardHomeByRole(user.role));
			analytics.pageview({
				path: "/dashboard",
				title: `${
					user?.role === "admin" ? "Admin"
					: user?.role === "provider" ? "Provider"
					: "Customer"
				} Dashboard`,
			});
		}
	}, [isAuthenticated, user?.role, router]);

  if (authLoading) {
    return <Loading />;
  }

  if (!isAuthenticated) return null;

  return <Loading />;
}
