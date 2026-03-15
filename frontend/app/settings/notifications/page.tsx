import { SettingsLayout } from '@/components/layout/SettingsLayout';
import { NotificationPreferences } from '@/components/features/notifications/NotificationPreferences';

export default function NotificationSettingsPage() {
  return (
    <SettingsLayout>
      <NotificationPreferences />
    </SettingsLayout>
  );
}
