'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/config/constants';
import { Layout } from '@/components/layout/Layout';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import { StatusBadge } from '@/components/ui/Badge';
import { jobService } from '@/services/job-service';
import { formatDate, formatCurrency } from '@/utils/helpers';
import Link from 'next/link';
import { Briefcase } from 'lucide-react';

export default function JobsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(ROUTES.LOGIN);
    }
  }, [isAuthenticated, authLoading, router]);
  const { data: jobs, isLoading } = useQuery({
    queryKey: ['my-jobs'],
    queryFn: () => jobService.getMyJobs(),
    enabled: isAuthenticated,
  });

  if (authLoading) {
    return <Loading />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Layout>
      <div className="container-custom py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Jobs</h1>
            <p className="mt-2 text-gray-600">
              Manage your active and completed jobs
            </p>
          </div>
        </div>

        {isLoading ? (
          <Loading />
        ) : jobs && jobs.length > 0 ? (
          <div className="grid gap-6">
            {jobs.map((job) => (
              <Card key={job.id} hover>
                <CardContent>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <Link href={`/jobs/${job.id}`}>
                        <div className="flex items-center gap-3">
                          <Briefcase className="h-5 w-5 text-gray-400" />
                          <h3 className="text-lg font-semibold text-gray-900 hover:text-primary-600">
                            Job #{job.id.slice(0, 8)}
                          </h3>
                        </div>
                      </Link>
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>
                            <span className="font-medium text-gray-700">
                              Provider:
                            </span>{' '}
                            {job.provider?.name || 'N/A'}
                          </span>
                          <span>•</span>
                          <span>
                            <span className="font-medium text-gray-700">
                              Customer:
                            </span>{' '}
                            {job.customer?.name || 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>Created {formatDate(job.created_at)}</span>
                          {job.started_at && (
                            <>
                              <span>•</span>
                              <span>
                                Started {formatDate(job.started_at)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <StatusBadge status={job.status} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent>
              <div className="text-center py-12">
                <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No jobs yet</p>
                <p className="text-sm text-gray-400">
                  Jobs will appear here once proposals are accepted
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
