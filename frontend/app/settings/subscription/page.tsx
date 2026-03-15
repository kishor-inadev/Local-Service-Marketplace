'use client';

import { useState, useEffect } from 'react';
import { SettingsLayout } from '@/components/layout/SettingsLayout';
import { SubscriptionManagement } from '@/components/features/subscription/SubscriptionManagement';

export default function SubscriptionPage() {
  const [providerId, setProviderId] = useState<string | null>(null);

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
