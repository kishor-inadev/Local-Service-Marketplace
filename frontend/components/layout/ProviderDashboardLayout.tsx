'use client';

import React, { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Layout } from './Layout';
import { LayoutDashboard, ImageIcon, Star, FileText } from 'lucide-react';

interface ProviderDashboardLayoutProps {
  children: ReactNode;
  providerId: string;
}

export function ProviderDashboardLayout({ children, providerId }: ProviderDashboardLayoutProps) {
  const pathname = usePathname();

  const tabs = [
    {
      href: `/providers/${providerId}/dashboard`,
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      href: `/providers/${providerId}/portfolio`,
      label: 'Portfolio',
      icon: ImageIcon,
    },
    {
      href: `/providers/${providerId}/reviews`,
      label: 'Reviews',
      icon: Star,
    },
    {
      href: `/providers/${providerId}/documents`,
      label: 'Documents',
      icon: FileText,
    },
  ];

  return (
    <Layout>
      <div className="container-custom py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Provider Dashboard</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your provider profile, portfolio, and customer reviews
          </p>
        </div>

        {/* Tabs Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = pathname === tab.href;

              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                    isActive
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div>{children}</div>
      </div>
    </Layout>
  );
}
