'use client';

import React, { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Layout } from './Layout';
import { ROUTES } from '@/config/constants';
import { Bell, CreditCard, Crown, Lock, User, Settings as SettingsIcon } from 'lucide-react';
import { isNotificationsEnabled } from '@/config/features';

interface SettingsLayoutProps {
  children: ReactNode;
}

export function SettingsLayout({ children }: SettingsLayoutProps) {
  const pathname = usePathname();

  const menuItems = [
    {
      href: ROUTES.DASHBOARD_SETTINGS,
      label: 'General',
      icon: SettingsIcon,
      enabled: true,
    },
    {
      href: ROUTES.DASHBOARD_SETTINGS_NOTIFICATIONS,
      label: 'Notifications',
      icon: Bell,
      enabled: isNotificationsEnabled(),
    },
    {
      href: ROUTES.DASHBOARD_SETTINGS_PASSWORD,
      label: 'Password',
      icon: Lock,
      enabled: true,
    },
    {
      href: ROUTES.DASHBOARD_SETTINGS_PAYMENT_METHODS,
      label: 'Payment Methods',
      icon: CreditCard,
      enabled: true,
    },
    {
      href: ROUTES.DASHBOARD_SETTINGS_SUBSCRIPTION,
      label: 'Subscription',
      icon: Crown,
      enabled: true,
    },
  ].filter(item => item.enabled);

  return (
    <Layout>
      <div className="container-custom py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <aside className="lg:col-span-1">
            <nav className="space-y-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </Layout>
  );
}
