'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/layout/Layout';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { StatusBadge } from '@/components/ui/Badge';
import { ErrorState } from '@/components/ui/ErrorState';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { jobService } from '@/services/job-service';
import { ROUTES } from '@/config/constants';
import { formatDate, formatCurrency } from '@/utils/helpers';
import { 
  ArrowLeft, 
  Briefcase, 
  Calendar, 
  User, 
  IndianRupee, 
  Clock, 
  AlertTriangle,
  Play,
  CheckCircle,
  XCircle,
  MessageSquare
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const jobId = params.id as string;

  const { data: job, isLoading, error } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => jobService.getJobById(jobId),
    enabled: isAuthenticated && !!jobId,
  });

  const startJobMutation = useMutation({
    mutationFn: () => jobService.startJob(jobId),
    onSuccess: () => {
      toast.success('Job started successfully!');
      queryClient.invalidateQueries({ queryKey: ['job', jobId] });
    },
    onError: () => {
      toast.error('Failed to start job');
    },
  });

  const completeJobMutation = useMutation({
    mutationFn: () => jobService.completeJob(jobId),
    onSuccess: () => {
      toast.success('Job completed successfully!');
      queryClient.invalidateQueries({ queryKey: ['job', jobId] });
    },
    onError: () => {
      toast.error('Failed to complete job');
    },
  });

  const cancelJobMutation = useMutation({
    mutationFn: (reason: string) => jobService.cancelJob(jobId, reason),
    onSuccess: () => {
      toast.success('Job cancelled');
      queryClient.invalidateQueries({ queryKey: ['job', jobId] });
    },
    onError: () => {
      toast.error('Failed to cancel job');
    },
  });

  if (authLoading || isLoading) {
    return (
      <Layout>
        <div className="container-custom py-8"><Loading /></div>
      </Layout>
    );
  }

  if (error || !job) {
    return (
      <Layout>
        <div className="container-custom py-8">
          <ErrorState
            title="Job not found"
            message="We couldn't find this job or you don't have permission to view it."
            retry={() => router.push(ROUTES.DASHBOARD_JOBS)}
          />
        </div>
      </Layout>
    );
  }

  const isProvider = user?.id === job.provider_id;
  const isCustomer = user?.id === job.customer_id;

  return (
    <ProtectedRoute>
      <Layout>
        <div className="container-custom py-8 max-w-4xl mx-auto">
          <Link
            href={ROUTES.DASHBOARD_JOBS}
            className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-6 text-sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to My Jobs
          </Link>

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Job #{job.display_id || job.id.slice(0, 8).toUpperCase()}
              </h1>
              <div className="flex flex-wrap gap-4 text-gray-600 dark:text-gray-400 text-sm">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Created {formatDate(job.created_at)}
                </span>
                <StatusBadge status={job.status} />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {isProvider && job.status === 'pending' && (
                <Button 
                  onClick={() => startJobMutation.mutate()} 
                  isLoading={startJobMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Job
                </Button>
              )}
              {isProvider && job.status === 'in_progress' && (
                <Button 
                  onClick={() => completeJobMutation.mutate()} 
                  isLoading={completeJobMutation.isPending}
                  className="bg-primary-600 hover:bg-primary-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark as Completed
                </Button>
              )}
              {(isProvider || isCustomer) && (job.status === 'pending' || job.status === 'in_progress') && (
                <Button 
                  variant="outline" 
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => {
                    const reason = window.prompt('Please enter a reason for cancellation:');
                    if (reason) cancelJobMutation.mutate(reason);
                  }}
                  isLoading={cancelJobMutation.isPending}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel Job
                </Button>
              )}
              <Button variant="outline" onClick={() => router.push(ROUTES.DASHBOARD_MESSAGES)}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Message {isProvider ? 'Customer' : 'Provider'}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Job Details Main */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-primary-500" />
                    Job Information
                  </h2>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Description</h3>
                    <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                      {job.request?.description || 'No description provided'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg shrink-0">
                        <IndianRupee className="h-5 w-5 text-primary-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Agreed Amount</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {formatCurrency(job.actual_amount || 0)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg shrink-0">
                        <Clock className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Duration Info</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {job.started_at ? `Started ${formatDate(job.started_at)}` : 'Not started yet'}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {job.status === 'cancelled' && job.cancellation_reason && (
                <Card className="border-red-100 bg-red-50/30 dark:bg-red-900/10">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
                      <div>
                        <h3 className="text-sm font-semibold text-red-800 dark:text-red-200">Cancellation Reason</h3>
                        <p className="text-sm text-red-700 dark:text-red-300 mt-1">{job.cancellation_reason}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar info */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">
                    {isProvider ? 'Customer Details' : 'Provider Details'}
                  </h3>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <User className="h-6 w-6 text-gray-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {isProvider ? job.customer?.name : (job.provider?.name || job.provider?.business_name)}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                        {isProvider ? 'Customer' : 'Service Provider'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Job Summary</h3>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Status</span>
                    <StatusBadge status={job.status} />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Created</span>
                    <span className="text-gray-900 dark:text-white font-medium">{formatDate(job.created_at)}</span>
                  </div>
                  {job.started_at && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Started</span>
                      <span className="text-gray-900 dark:text-white font-medium">{formatDate(job.started_at)}</span>
                    </div>
                  )}
                  {job.completed_at && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Completed</span>
                      <span className="text-gray-900 dark:text-white font-medium">{formatDate(job.completed_at)}</span>
                    </div>
                  )}
                  <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-between">
                    <span className="text-base font-semibold">Total Amount</span>
                    <span className="text-base font-bold text-primary-600">
                      {formatCurrency(job.actual_amount || 0)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
