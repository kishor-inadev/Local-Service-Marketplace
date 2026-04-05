'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/config/constants';
import { Layout } from '@/components/layout/Layout';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { StatusBadge } from '@/components/ui/Badge';
import { ErrorState } from '@/components/ui/ErrorState';
import { jobService } from '@/services/job-service';
import { formatDate, formatCurrency } from '@/utils/helpers';
import toast from 'react-hot-toast';
import { ArrowLeft, Calendar, DollarSign, User, FileText } from "lucide-react";
import Link from 'next/link';
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const jobId = params.id as string;

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(ROUTES.LOGIN);
    }
  }, [isAuthenticated, authLoading, router]);

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
      toast.success('Job marked as complete!');
      queryClient.invalidateQueries({ queryKey: ['job', jobId] });
    },
    onError: () => {
      toast.error('Failed to complete job');
    },
  });

  if (authLoading) {
    return (
      <Layout>
        <Loading />
      </Layout>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="container-custom py-8">
          <Loading />
        </div>
      </Layout>
    );
  }

  if (error || !job) {
    return (
			<Layout>
				<div className='container-custom py-8'>
					<ErrorState
						title='Job not found'
						message="We couldn't find the job you're looking for."
						retry={() => router.push(ROUTES.DASHBOARD_JOBS)}
					/>
				</div>
			</Layout>
		);
  }

  const isProvider = user?.role === 'provider';
  const isCustomer = user?.role === 'customer';
  const canStartJob = isProvider && job.status === 'scheduled';
  const canCompleteJob = isProvider && job.status === 'in_progress';
  const canPayJob = isCustomer && job.status === "completed";

  return (
		<ProtectedRoute>
			<Layout>
				<div className='container-custom py-8'>
					{/* Back Button */}
					<Link
						href={ROUTES.DASHBOARD_JOBS}
						className='inline-flex items-center text-primary-600 hover:text-primary-700 mb-6'>
						<ArrowLeft className='h-4 w-4 mr-2' />
						Back to Jobs
					</Link>

					{/* Header */}
					<div className='flex items-start justify-between mb-8'>
						<div>
							<h1 className='text-3xl font-bold text-gray-900 dark:text-white mb-2'>Job #{job.display_id || job.id.slice(0, 8)}</h1>
							<p className='text-gray-600 dark:text-gray-400'>Created {formatDate(job.created_at)}</p>
						</div>
						<StatusBadge status={job.status} />
					</div>

					<div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
						{/* Main Content */}
						<div className='lg:col-span-2 space-y-6'>
							{/* Job Details */}
							<Card>
								<CardHeader>
									<h2 className='text-lg font-semibold text-gray-900 dark:text-white'>Job Details</h2>
								</CardHeader>
								<CardContent>
									<div className='space-y-4'>
										<div className='flex items-start gap-3'>
											<FileText className='h-5 w-5 text-gray-400 mt-0.5' />
											<div>
												<p className='text-sm font-medium text-gray-700 dark:text-gray-300'>Job Description</p>
												<p className='text-gray-900 dark:text-white mt-1'>
													{job.request?.description || job.proposal?.message || "No description available"}
												</p>
											</div>
										</div>

										<div className='flex items-center gap-3'>
											<DollarSign className='h-5 w-5 text-gray-400' />
											<div>
												<p className='text-sm font-medium text-gray-700 dark:text-gray-300'>Payment Amount</p>
												<p className='text-lg font-semibold text-green-600 dark:text-green-400'>
													{formatCurrency(job.actual_amount || 0)}
												</p>
											</div>
										</div>

										{job.started_at && (
											<div className='flex items-center gap-3'>
												<Calendar className='h-5 w-5 text-gray-400' />
												<div>
													<p className='text-sm font-medium text-gray-700 dark:text-gray-300'>Started Date</p>
													<p className='text-gray-900 dark:text-white'>{formatDate(job.started_at)}</p>
												</div>
											</div>
										)}

										{job.completed_at && (
											<div className='flex items-center gap-3'>
												<Calendar className='h-5 w-5 text-gray-400' />
												<div>
													<p className='text-sm font-medium text-gray-700 dark:text-gray-300'>Completed Date</p>
													<p className='text-gray-900 dark:text-white'>{formatDate(job.completed_at)}</p>
												</div>
											</div>
										)}
									</div>
								</CardContent>
							</Card>

							{/* Actions */}
							{(canStartJob || canCompleteJob || canPayJob) && (
								<Card>
									<CardHeader>
										<h2 className='text-lg font-semibold text-gray-900 dark:text-white'>Actions</h2>
									</CardHeader>
									<CardContent>
										<div className='flex gap-4'>
											{canStartJob && (
												<Button
													onClick={() => startJobMutation.mutate()}
													disabled={startJobMutation.isPending}>
													{startJobMutation.isPending ? "Starting..." : "Start Job"}
												</Button>
											)}
											{canCompleteJob && (
												<Button
													onClick={() => completeJobMutation.mutate()}
													disabled={completeJobMutation.isPending}>
													{completeJobMutation.isPending ? "Completing..." : "Mark as Complete"}
												</Button>
											)}
											{canPayJob && <Button onClick={() => router.push(`/checkout?jobId=${job.id}`)}>Pay Now</Button>}
										</div>
									</CardContent>
								</Card>
							)}
						</div>

						{/* Sidebar */}
						<div className='space-y-6'>
							{/* Customer Info */}
							{job.customer && (
								<Card>
									<CardHeader>
										<h2 className='text-lg font-semibold text-gray-900 dark:text-white'>Customer</h2>
									</CardHeader>
									<CardContent>
										<div className='flex items-center gap-3'>
											<div className='h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center'>
												<User className='h-5 w-5 text-primary-600 dark:text-primary-400' />
											</div>
											<div>
												<p className='font-medium text-gray-900 dark:text-white'>
													{job.customer.name || job.customer.email}
												</p>
												<p className='text-sm text-gray-600 dark:text-gray-400'>{job.customer.email}</p>
											</div>
										</div>
									</CardContent>
								</Card>
							)}

							{/* Provider Info */}
							{job.provider && (
								<Card>
									<CardHeader>
										<h2 className='text-lg font-semibold text-gray-900 dark:text-white'>Provider</h2>
									</CardHeader>
									<CardContent>
										<div className='flex items-center gap-3'>
											<div className='h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center'>
												<User className='h-5 w-5 text-primary-600 dark:text-primary-400' />
											</div>
											<div>
												<p className='font-medium text-gray-900 dark:text-white'>
													{job.provider.business_name || job.provider.user?.name}
												</p>
												{job.provider.rating && (
													<p className='text-sm text-gray-600 dark:text-gray-400'>
														⭐ {job.provider.rating.toFixed(1)}
													</p>
												)}
											</div>
										</div>
									</CardContent>
								</Card>
							)}

							{/* Timeline */}
							<Card>
								<CardHeader>
									<h2 className='text-lg font-semibold text-gray-900 dark:text-white'>Timeline</h2>
								</CardHeader>
								<CardContent>
									<div className='space-y-3 text-sm'>
										<div>
											<p className='font-medium text-gray-900 dark:text-white'>Created</p>
											<p className='text-gray-600 dark:text-gray-400'>{formatDate(job.created_at)}</p>
										</div>
										{job.started_at && (
											<div>
												<p className='font-medium text-gray-900 dark:text-white'>Started</p>
												<p className='text-gray-600 dark:text-gray-400'>{formatDate(job.started_at)}</p>
											</div>
										)}
										{job.completed_at && (
											<div>
												<p className='font-medium text-gray-900 dark:text-white'>Completed</p>
												<p className='text-gray-600 dark:text-gray-400'>{formatDate(job.completed_at)}</p>
											</div>
										)}
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
