'use client';

import { ProviderDashboardLayout } from '@/components/layout/ProviderDashboardLayout';
import { DocumentUpload } from '@/components/features/provider/DocumentUpload';
import { DocumentList } from '@/components/features/provider/DocumentList';
import { PortfolioUpload } from '@/components/features/provider/PortfolioUpload';
import { PortfolioGallery } from '@/components/features/provider/PortfolioGallery';

export default function ProviderDashboard({ params }: { params: { id: string } }) {
  return (
    <ProviderDashboardLayout providerId={params.id}>
      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Quick Overview
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                Portfolio Items
              </h3>
              <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                View in Portfolio tab
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                Customer Reviews
              </h3>
              <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                View in Reviews tab
              </p>
            </div>
          </div>
        </div>
      </div>
    </ProviderDashboardLayout>
  );
}
