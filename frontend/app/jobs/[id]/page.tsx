'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { Layout } from '@/components/layout/Layout';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { StatusBadge } from '@/components/ui/Badge';
import { jobService } from '@/services/job-service';
import { formatDate, formatDateTime } from '@/utils/helpers';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  const { data: job, isLoading } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => jobService.getJobById(jobId),
  });

  if (isLoading) {
    return (
      <Layout>
        <Loading />
      </Layout>
    );
  }

  if (!job) {
    return (
      <Layout>
        <div className="container-custom py-8">
          <p>Job not found</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-custom py-8">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Job #{job.id.slice(0, 8)}
                </h1>
                <p className="text-sm text-gray-500 mt-2">
                  Created {formatDate(job.created_at)}
                </p>
              </div>
              <StatusBadge status={job.status} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Provider
                </h3>
                <p className="text-gray-900">
                  {job.provider?.name || 'Provider'}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Customer
                </h3>
                <p className="text-gray-900">
                  {job.customer?.name || 'Customer'}
                </p>
              </div>
              {job.started_at && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">
                    Started At
                  </h3>
                  <p className="text-gray-900">{formatDateTime(job.started_at)}</p>
                </div>
              )}
              {job.completed_at && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">
                    Completed At
                  </h3>
                  <p className="text-gray-900">
                    {formatDateTime(job.completed_at)}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 pt-6 border-t">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">
                Actions
              </h3>
              <div className="flex gap-3">
                {job.status === 'scheduled' && (
                  <Button size="sm">Start Job</Button>
                )}
                {job.status === 'in_progress' && (
                  <Button size="sm">Complete Job</Button>
                )}
                <Button variant="outline" size="sm">
                  View Messages
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
