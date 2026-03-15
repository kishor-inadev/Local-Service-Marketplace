'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/config/constants';
import { Loading } from '@/components/ui/Loading';
import { SettingsLayout } from '@/components/layout/SettingsLayout';
import { SubscriptionManagement } from '@/components/features/subscription/SubscriptionManagement';

export default function SubscriptionPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [providerId, setProviderId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(ROUTES.LOGIN);
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    const getProviderId = async () => {
      try {
        const authState = JSON.parse(localStorage.getItem('auth-storage') || '{}');
        const userId = authState?.state?.user?.id;
        
        if (userId) {
          setProviderId(userId);
        }
      } catch (error) {
        console.error('Failed to get provider ID:', error);
      }
    };

    getProviderId();
  }, []);

  if (authLoading) {
    return <Loading />;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!providerId) {
    return (
      <SettingsLayout>
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
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
