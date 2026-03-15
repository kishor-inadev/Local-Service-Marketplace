'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/config/constants';
import { Loading } from '@/components/ui/Loading';
import { SettingsLayout } from '@/components/layout/SettingsLayout';
import { NotificationPreferences } from '@/components/features/notifications/NotificationPreferences';

export default function NotificationSettingsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(ROUTES.LOGIN);
    }
  }, [isAuthenticated, authLoading, router]);

  if (authLoading) {
    return <Loading />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <SettingsLayout>
      <NotificationPreferences />
    </SettingsLayout>
  );
}
