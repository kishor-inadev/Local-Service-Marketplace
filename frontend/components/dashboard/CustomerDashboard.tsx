'use client';

import { useRouter } from "next/navigation";
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/config/constants';
import { isNotificationsEnabled } from '@/config/features';
import { Layout } from '@/components/layout/Layout';
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { ErrorState } from "@/components/ui/ErrorState";
import { requestService } from '@/services/request-service';
import { jobService } from '@/services/job-service';
import { notificationService } from '@/services/notification-service';
import { formatDate, formatCurrency } from '@/utils/helpers';
import Link from 'next/link';
import { Plus, Briefcase, FileText, Bell } from 'lucide-react';
import { SkeletonStatCard, SkeletonListItem } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

export default function CustomerDashboard() {
	const router = useRouter();
	const { user, isAuthenticated } = useAuth();

	const {
		data: requests,
		isLoading: requestsLoading,
		error: requestsError,
		refetch: refetchRequests,
	} = useQuery({ queryKey: ["my-requests"], queryFn: () => requestService.getMyRequests(), enabled: isAuthenticated });

	const {
		data: jobs,
		isLoading: jobsLoading,
		error: jobsError,
		refetch: refetchJobs,
	} = useQuery({ queryKey: ["my-jobs"], queryFn: () => jobService.getMyJobs(), enabled: isAuthenticated });

	const {
		data: notifications,
		isLoading: notificationsLoading,
		error: notificationsError,
	} = useQuery({
		queryKey: ["notifications"],
		queryFn: () => notificationService.getNotifications({ limit: 5 }),
		enabled: isAuthenticated && isNotificationsEnabled(),
	});

	const hasError = requestsError || jobsError;
	const activeJobs = jobs?.filter((j) => j.status === "in_progress") || [];

	if (hasError) {
		return (
			<Layout>
				<div className='container-custom py-12'>
					<ErrorState
						title='Failed to load dashboard'
						message="We couldn't load your dashboard data. Please try again."
						retry={() => {
							refetchRequests();
							refetchJobs();
						}}
					/>
				</div>
			</Layout>
		);
	}

	return (
		<Layout>
			<div className='container-custom py-12'>
				{/* Welcome Section */}
				<div className='mb-12'>
					<h1 className='text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-3'>
						Welcome back, {user?.name || user?.email}!
					</h1>
					<p className='text-lg text-gray-600 dark:text-gray-400'>Here's what's happening with your service requests</p>
				</div>

				{/* Quick Stats */}
				<div
					className={`grid grid-cols-1 ${isNotificationsEnabled() ? "md:grid-cols-3" : "md:grid-cols-2"} gap-6 mb-10`}>
					{requestsLoading ?
						<SkeletonStatCard />
						: <Card
							hover
							className='animate-fade-in'>
							<CardContent className='flex items-center justify-between p-6'>
								<div>
									<p className='text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400'>
										Active Requests
									</p>
									<p className='text-3xl font-bold text-gray-900 dark:text-white mt-2'>
										{requests?.filter((r) => r.status === "open").length ?? 0}
									</p>
								</div>
								<div className='h-12 w-12 rounded-2xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0'>
									<FileText className='h-6 w-6 text-primary-600 dark:text-primary-400' />
								</div>
							</CardContent>
						</Card>
					}

					{jobsLoading ?
						<SkeletonStatCard />
						: <Card
							hover
							className='animate-fade-in'>
							<CardContent className='flex items-center justify-between p-6'>
								<div>
									<p className='text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400'>
										Active Jobs
									</p>
									<p className='text-3xl font-bold text-gray-900 dark:text-white mt-2'>{activeJobs.length}</p>
								</div>
								<div className='h-12 w-12 rounded-2xl bg-green-50 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0'>
									<Briefcase className='h-6 w-6 text-green-600 dark:text-green-400' />
								</div>
							</CardContent>
						</Card>
					}

					{isNotificationsEnabled() &&
						(notificationsLoading ?
							<SkeletonStatCard />
							: <Card
								hover
								className='animate-fade-in'>
								<CardContent className='flex items-center justify-between p-6'>
									<div>
										<p className='text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400'>
											Unread Notifications
										</p>
										<p className='text-3xl font-bold text-gray-900 dark:text-white mt-2'>
											{notifications?.filter((n) => !n.read).length ?? 0}
										</p>
									</div>
									<div className='h-12 w-12 rounded-2xl bg-yellow-50 dark:bg-yellow-900/30 flex items-center justify-center flex-shrink-0'>
										<Bell className='h-6 w-6 text-yellow-600 dark:text-yellow-400' />
									</div>
								</CardContent>
							</Card>)}
				</div>

				<div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
					{/* Recent Requests */}
					<Card>
						<CardHeader>
							<div className='flex items-center justify-between'>
								<h2 className='text-lg font-semibold text-gray-900 dark:text-white'>Recent Requests</h2>
								<Link href={ROUTES.CREATE_REQUEST}>
									<Button size='sm'>
										<Plus className='h-4 w-4 mr-1' />
										New Request
									</Button>
								</Link>
							</div>
						</CardHeader>
						<CardContent>
							{requestsLoading ?
								<div className='space-y-3'>
									{[...Array(3)].map((_, i) => (
										<SkeletonListItem key={i} />
									))}
								</div>
								: requests && requests.length > 0 ?
									<div className='space-y-3'>
										{requests.slice(0, 5).map((request) => (
											<Link
												key={request.id}
												href={ROUTES.DASHBOARD_REQUEST_DETAIL(request.id)}
												className='block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:border-primary-200 dark:hover:border-primary-700 transition-all'>
												<div className='flex items-start justify-between gap-3'>
													<div className='flex-1 min-w-0'>
														<h3 className='font-medium text-gray-900 dark:text-white truncate'>
															Request #{request.display_id || request.id.substring(0, 8)}
														</h3>
														<p className='text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-1'>
															{request.description}
														</p>
														<p className='text-xs text-gray-400 dark:text-gray-500 mt-1.5'>
															{formatCurrency(request.budget)} &bull; {formatDate(request.created_at)}
														</p>
													</div>
													<StatusBadge status={request.status} />
												</div>
											</Link>
										))}
									</div>
									: <EmptyState
										title='No requests yet'
										description='Post your first service request to get proposals from local professionals.'
										icon='file'
										action={{ label: "Create Request", onClick: () => router.push(ROUTES.CREATE_REQUEST) }}
									/>
							}
						</CardContent>
					</Card>

					{/* Active Jobs */}
					<Card>
						<CardHeader>
							<div className='flex items-center justify-between'>
								<h2 className='text-lg font-semibold text-gray-900 dark:text-white'>Active Jobs</h2>
								<Link href={ROUTES.DASHBOARD_JOBS}>
									<Button
										variant='outline'
										size='sm'>
										View All
									</Button>
								</Link>
							</div>
						</CardHeader>
						<CardContent>
							{jobsLoading ?
								<div className='space-y-3'>
									{[...Array(3)].map((_, i) => (
										<SkeletonListItem key={i} />
									))}
								</div>
								: activeJobs.length > 0 ?
									<div className='space-y-3'>
										{activeJobs
											.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
											.slice(0, 5)
											.map((job) => (
												<Link
													key={job.id}
													href={ROUTES.DASHBOARD_JOB_DETAIL(job.id)}
													className='block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:border-green-200 dark:hover:border-green-700 transition-all'>
													<div className='flex items-start justify-between gap-3'>
														<div className='flex-1 min-w-0'>
															<h3 className='font-medium text-gray-900 dark:text-white truncate'>
																Job #{job.display_id || job.id.slice(0, 8)}
															</h3>
															<p className='text-sm text-gray-500 dark:text-gray-400 mt-1'>
																{job.provider?.name || "Provider"}
															</p>
															<p className='text-xs text-gray-400 dark:text-gray-500 mt-1.5'>
																{formatDate(job.created_at)}
															</p>
														</div>
														<StatusBadge status={job.status} />
													</div>
												</Link>
											))}
									</div>
									: <EmptyState
										title='No active jobs'
										description='Your accepted service requests will appear here.'
										icon='inbox'
									/>
							}
						</CardContent>
					</Card>
				</div>

				{/* Recent Notifications */}
				{isNotificationsEnabled() && (
					<Card className='mt-8'>
						<CardHeader>
							<div className='flex items-center justify-between'>
								<h2 className='text-lg font-semibold text-gray-900 dark:text-white'>Recent Notifications</h2>
								<Link href={ROUTES.DASHBOARD_NOTIFICATIONS}>
									<Button
										variant='outline'
										size='sm'>
										View All
									</Button>
								</Link>
							</div>
						</CardHeader>
						<CardContent>
							{notificationsLoading ?
								<div className='space-y-2'>
									{[...Array(3)].map((_, i) => (
										<div
											key={i}
											className='h-16 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse'
										/>
									))}
								</div>
								: notifications && notifications.length > 0 ?
									<div className='space-y-2'>
										{notifications.map((notification) => (
											<div
												key={notification.id}
												className={`p-3 rounded-lg border-l-4 ${notification.read ?
													"bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
													: "bg-primary-50 dark:bg-primary-900/20 border-primary-500"
													}`}>
												<div className='flex items-start justify-between gap-2'>
													<h4 className='font-medium text-gray-900 dark:text-white capitalize text-sm'>
														{notification.type.replace(/_/g, " ")}
													</h4>
													{!notification.read && (
														<span className='inline-block w-2 h-2 mt-1.5 bg-primary-500 rounded-full flex-shrink-0' />
													)}
												</div>
												<p className='text-sm text-gray-600 dark:text-gray-400 mt-1'>{notification.message}</p>
												<p className='text-xs text-gray-400 dark:text-gray-500 mt-1.5'>
													{formatDate(notification.created_at)}
												</p>
											</div>
										))}
									</div>
									: <EmptyState
										title='No notifications'
										icon='inbox'
									/>
							}
						</CardContent>
					</Card>
				)}
			</div>
		</Layout>
	);
}
