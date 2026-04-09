'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES, getDashboardHomeByRole } from "@/config/constants";
import { Loading } from '@/components/ui/Loading';
import { analytics } from "@/utils/analytics";
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/api-client';

const CustomerDashboard = dynamic(() => import("@/components/dashboard/CustomerDashboard"), {
  loading: () => <Loading />,
});
const ProviderDashboard = dynamic(() => import("@/components/dashboard/ProviderDashboard"), {
  loading: () => <Loading />,
});

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const { data: provider, isLoading: providerLoading } = useQuery({
    queryKey: ["provider-profile-check", user?.id],
    queryFn: async () => {
      const response = await apiClient.get(`/providers?user_id=${user?.id}`);
      if (response.data?.data && response.data.data.length > 0) return response.data.data[0];
      if (Array.isArray(response.data) && response.data.length > 0) return response.data[0];
      return null;
    },
    enabled: isAuthenticated && user?.role === "provider",
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(ROUTES.LOGIN);
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated && user?.role === "provider" && !providerLoading && provider === null) {
      router.replace(ROUTES.ONBOARDING);
    }
  }, [isAuthenticated, user?.role, provider, providerLoading, router]);

  useEffect(() => {
		if (isAuthenticated && user?.role) {
      if (user.role === "admin") {
				router.replace(getDashboardHomeByRole(user.role));
			}
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

  if (authLoading || (user?.role === "provider" && providerLoading)) {
    return <Loading />;
  }

  if (!isAuthenticated) return null;

  if (user?.role === "provider") {
		return <ProviderDashboard />;
	}

	return <CustomerDashboard />;
}
