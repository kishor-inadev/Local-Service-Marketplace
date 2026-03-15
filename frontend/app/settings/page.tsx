'use client';

import { SettingsLayout } from '@/components/layout/SettingsLayout';

export default function SettingsPage() {
  return (
    <SettingsLayout>
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          General Settings
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your account preferences and settings.
        </p>
        <div className="mt-6 space-y-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">
              Account Information
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              View and update your account details in the Profile section.
            </p>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">
              Security
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Manage your password and security settings using the navigation menu.
            </p>
          </div>
        </div>
      </div>
    </SettingsLayout>
  );
}
