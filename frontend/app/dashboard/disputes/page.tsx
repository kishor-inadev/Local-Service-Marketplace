'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Permission } from '@/utils/permissions';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { Loading } from '@/components/ui/Loading';
import { ErrorState } from '@/components/ui/ErrorState';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { disputeService } from '@/services/dispute-service';
import { formatDate } from '@/utils/helpers';
import { AlertTriangle, Plus, ArrowRight } from 'lucide-react';
import Link from 'next/link';



export default function MyDisputesPage() {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['my-disputes', statusFilter, page],
    queryFn: () => disputeService.getMyDisputes({ status: statusFilter || undefined, page, limit }),
    enabled: !!user,
  });

  const disputes = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  return (
    <ProtectedRoute requiredPermissions={[Permission.DISPUTES_READ]}>
      <Layout>
        <div className="container-custom py-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">
                My Disputes
              </h1>
              <p className="text-gray-600 dark:text-gray-400">Track disputes you have filed on jobs</p>
            </div>
            <Link href="/dashboard/disputes/file">
              <Button variant="primary" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                File a Dispute
              </Button>
            </Link>
          </div>

          {/* Filter */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <select
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500"
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
                <option value="">All Statuses</option>
                <option value="open">Open</option>
                <option value="investigating">Investigating</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </CardContent>
          </Card>

          {error ? (
            <ErrorState
              title="Failed to load disputes"
              message="We couldn't load your disputes. Please try again."
              retry={() => refetch()}
            />
          ) : isLoading ? (
            <Loading />
          ) : disputes.length === 0 ? (
            <Card>
              <CardContent className="text-center py-16">
                <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No disputes found</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {statusFilter ? 'No disputes with this status.' : 'You have not filed any disputes yet.'}
                </p>
                <Link href="/dashboard/disputes/file">
                  <Button variant="primary">File a Dispute</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="space-y-4">
                {disputes.map((dispute) => (
                  <Card key={dispute.id} hover>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              Dispute #{dispute.display_id || dispute.id.substring(0, 8)}
                            </h3>
                            <StatusBadge status={dispute.status} />
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                            <span className="font-medium">Reason:</span> {dispute.reason}
                          </p>
                          {dispute.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 line-clamp-2">
                              {dispute.description}
                            </p>
                          )}
                          {dispute.resolution && (
                            <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                              <span className="font-medium">Resolution:</span> {dispute.resolution}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                            Filed {formatDate(dispute.created_at)}
                            {dispute.resolved_at && ` · Resolved ${formatDate(dispute.resolved_at)}`}
                          </p>
                        </div>
                        <div className="ml-4 flex flex-col gap-2">
                          <Link href={`/dashboard/disputes/${dispute.id}`}>
                            <Button variant="primary" size="sm" className="flex items-center gap-1 w-full">
                              View Details
                              <ArrowRight className="h-3 w-3" />
                            </Button>
                          </Link>
                          <Link href={`/dashboard/jobs/${dispute.job_id}`}>
                            <Button variant="outline" size="sm" className="flex items-center gap-1 w-full">
                              View Job
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Page {page} of {totalPages}
                  </span>
                  <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
