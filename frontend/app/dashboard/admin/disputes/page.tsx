'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/config/constants';
import { Layout } from '@/components/layout/Layout';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { adminService } from '@/services/admin-service';
import { formatDate } from '@/utils/helpers';

export default function AdminDisputesPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push(ROUTES.LOGIN);
      } else if (user?.role !== 'admin') {
        router.push(ROUTES.DASHBOARD);
      }
    }
  }, [isAuthenticated, authLoading, user, router]);

  const { data: disputes, isLoading } = useQuery({
    queryKey: ['admin-disputes'],
    queryFn: () => adminService.getDisputes(),
    enabled: user?.role === 'admin',
  });

  if (authLoading) {
    return <Loading />;
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return null;
  }

  return (
    <Layout>
      <div className="container-custom py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Dispute Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Review and resolve disputes between customers and providers
          </p>
        </div>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              All Disputes ({disputes?.length || 0})
            </h2>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loading size="sm" />
            ) : disputes && disputes.length > 0 ? (
              <div className="space-y-4">
                {disputes.map((dispute: any) => (
                  <div
                    key={dispute.id}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          Dispute #{dispute.id.slice(0, 8)}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Job ID: {dispute.job_id?.slice(0, 8)}
                        </p>
                      </div>
                      <StatusBadge status={dispute.status} />
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                      {dispute.description || 'No description provided'}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Filed {formatDate(dispute.created_at)}
                      </p>
                      <Button variant="outline" size="sm">
                        Review Dispute
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-gray-500 dark:text-gray-400">
                No disputes found
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
