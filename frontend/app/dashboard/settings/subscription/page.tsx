'use client';

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { Permission } from '@/utils/permissions';
import { ROUTES } from '@/config/constants';
import { Loading } from '@/components/ui/Loading';
import { SettingsLayout } from '@/components/layout/SettingsLayout';
import { SubscriptionManagement } from '@/components/features/subscription/SubscriptionManagement';
import { getProviderProfileByUserId } from "@/services/user-service";

export default function SubscriptionPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { can } = usePermissions();

  const { data: provider, isLoading: providerLoading } = useQuery({
		queryKey: ["provider-profile-by-user", user?.id],
		queryFn: () => getProviderProfileByUserId(user!.id),
		enabled: isAuthenticated && can(Permission.SUBSCRIPTIONS_MANAGE) && !!user?.id,
	});

	const providerId = provider?.id ?? null;

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(ROUTES.LOGIN);
    }
  }, [isAuthenticated, authLoading, router]);

  if (authLoading || providerLoading) {
		return <Loading />;
	}

  if (!isAuthenticated) {
    return null;
  }

  if (!providerId) {
    return (
			<SettingsLayout>
				<div className='text-center py-12'>
					<p className='text-gray-600 dark:text-gray-400'>Provider profile not found.</p>
				</div>
			</SettingsLayout>
		);
  }

  return (
    <SettingsLayout>
      <SubscriptionManagement providerId={providerId} />
    </SettingsLayout>
  );
}
