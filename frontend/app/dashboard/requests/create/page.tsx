import { Suspense } from 'react';
import { Layout } from '@/components/layout/Layout';
import { CreateRequestForm } from '@/components/forms/CreateRequestForm';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Post a Service Request',
  description: 'Describe your project, set your budget, and get proposals from verified local providers.',
};

export default function CreateRequestPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <div className="container-custom py-10">
          <div className="max-w-2xl mx-auto mb-8 text-center">
            <h1 className="font-heading text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Post a Service Request
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Describe your project and receive competitive proposals from verified providers.
            </p>
          </div>
          <Suspense>
            <CreateRequestForm />
          </Suspense>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
