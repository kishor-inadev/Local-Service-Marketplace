'use client';

import { useRouter } from "next/navigation";
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/config/constants';
import { Layout } from '@/components/layout/Layout';
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonStatCard, SkeletonListItem } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { apiClient } from '@/services/api-client';
import { proposalService } from '@/services/proposal-service';
import { jobService } from '@/services/job-service';
import { formatDate, formatCurrency } from '@/utils/helpers';
import Link from 'next/link';
import { Briefcase, FileText, DollarSign, Search, Calendar, TrendingUp, User, Star, ImageIcon } from "lucide-react";

export default function ProviderDashboard() {
	const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const {
		data: proposals,
		isLoading: proposalsLoading,
		error: proposalsError,
		refetch: refetchProposals,
	} = useQuery({
		queryKey: ["my-proposals"],
		queryFn: () => proposalService.getMyProposals(),
		enabled: isAuthenticated,
	});

  const {
		data: jobs,
		isLoading: jobsLoading,
		error: jobsError,
		refetch: refetchJobs,
	} = useQuery({ queryKey: ["provider-jobs"], queryFn: () => jobService.getMyJobs(), enabled: isAuthenticated });

  if (proposalsError || jobsError) {
		return (
			<Layout>
				<div className='container-custom py-12'>
					<ErrorState
						title='Failed to load dashboard'
						message="We couldn't load your dashboard data. Please try again."
						retry={() => {
							refetchProposals();
							refetchJobs();
						}}
					/>
				</div>
			</Layout>
		);
	}

	// Safely extract arrays from potentially paginated responses
	const proposalList = apiClient.extractList(proposals);
	const jobList = apiClient.extractList(jobs);

	const completedJobs = jobList.filter((j: any) => j.status === "completed");
	const activeJobsList = jobList.filter((j: any) => j.status === "in_progress");
	const acceptedProposals = proposalList.filter((p: any) => p.status === "accepted").length;

	// Calculate earnings from completed jobs
	const totalEarnings = completedJobs.reduce((sum: number, job: any) => sum + (job.actual_amount || 0), 0);
	const pendingProposals = proposalList.filter((p: any) => p.status === "pending").length;
	const activeJobs = activeJobsList.length;
	const successRate = proposalList.length > 0 ? Math.round((acceptedProposals / proposalList.length) * 100) : 0;

  return (
		<Layout>
			<div className='container-custom py-12'>
				{/* Welcome Section */}
				<div className='mb-12'>
					<h1 className='text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-3'>
						Welcome back, {user?.name || user?.email}!
					</h1>
					<p className='text-lg text-gray-600 dark:text-gray-400'>Manage your service business and grow your income</p>
				</div>

				{/* Quick Stats */}
				<div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-10'>
					{proposalsLoading ?
						<SkeletonStatCard />
					:	<Card
							hover
							className='animate-fade-in'>
							<CardContent className='flex items-center justify-between p-6'>
								<div>
									<p className='text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400'>
										Pending Proposals
									</p>
									<p className='text-3xl font-bold text-gray-900 dark:text-white mt-2'>{pendingProposals}</p>
								</div>
								<div className='h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0'>
									<FileText className='h-6 w-6 text-blue-600 dark:text-blue-400' />
								</div>
							</CardContent>
						</Card>
					}

					{jobsLoading ?
						<SkeletonStatCard />
					:	<Card
							hover
							className='animate-fade-in'>
							<CardContent className='flex items-center justify-between p-6'>
								<div>
									<p className='text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400'>
										Active Jobs
									</p>
									<p className='text-3xl font-bold text-gray-900 dark:text-white mt-2'>{activeJobs}</p>
								</div>
								<div className='h-12 w-12 rounded-2xl bg-green-50 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0'>
									<Briefcase className='h-6 w-6 text-green-600 dark:text-green-400' />
								</div>
							</CardContent>
						</Card>
					}

					{jobsLoading ?
						<SkeletonStatCard />
					:	<Card
							hover
							className='animate-fade-in'>
							<CardContent className='flex items-center justify-between p-6'>
								<div>
									<p className='text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400'>
										Total Earnings
									</p>
									<p className='text-3xl font-bold text-gray-900 dark:text-white mt-2'>
										{formatCurrency(totalEarnings)}
									</p>
								</div>
								<div className='h-12 w-12 rounded-2xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0'>
									<DollarSign className='h-6 w-6 text-primary-600 dark:text-primary-400' />
								</div>
							</CardContent>
						</Card>
					}

					{proposalsLoading ?
						<SkeletonStatCard />
					:	<Card
							hover
							className='animate-fade-in'>
							<CardContent className='flex items-center justify-between p-6'>
								<div>
									<p className='text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400'>
										Success Rate
									</p>
									<p className='text-3xl font-bold text-gray-900 dark:text-white mt-2'>{successRate}%</p>
								</div>
								<div className='h-12 w-12 rounded-2xl bg-yellow-50 dark:bg-yellow-900/30 flex items-center justify-center flex-shrink-0'>
									<TrendingUp className='h-6 w-6 text-yellow-600 dark:text-yellow-400' />
								</div>
							</CardContent>
						</Card>
					}
				</div>

				{/* Quick Actions */}
				<Card className='mb-8'>
					<CardHeader>
						<h2 className='text-lg font-semibold text-gray-900 dark:text-white'>Quick Actions</h2>
					</CardHeader>
					<CardContent>
						<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
							<Link href={ROUTES.DASHBOARD_BROWSE_REQUESTS}>
								<Button
									variant='outline'
									className='w-full justify-start'>
									<Search className='h-4 w-4 mr-2' />
									Browse Service Requests
								</Button>
							</Link>
							<Link href={ROUTES.DASHBOARD_MY_PROPOSALS}>
								<Button
									variant='outline'
									className='w-full justify-start'>
									<FileText className='h-4 w-4 mr-2' />
									View My Proposals
								</Button>
							</Link>
							<Link href={ROUTES.DASHBOARD_AVAILABILITY}>
								<Button
									variant='outline'
									className='w-full justify-start'>
									<Calendar className='h-4 w-4 mr-2' />
									Set Availability
								</Button>
							</Link>
						</div>
					</CardContent>
				</Card>

				{/* Provider Profile Management */}
				<Card className='mb-8'>
					<CardHeader>
						<h2 className='text-lg font-semibold text-gray-900 dark:text-white'>Profile Management</h2>
					</CardHeader>
					<CardContent>
						<div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
							<Link href={ROUTES.DASHBOARD_PROVIDER_OVERVIEW}>
								<Button
									variant='outline'
									className='w-full justify-start'>
									<User className='h-4 w-4 mr-2' />
									Overview
								</Button>
							</Link>
							<Link href={ROUTES.DASHBOARD_PROVIDER_PORTFOLIO}>
								<Button
									variant='outline'
									className='w-full justify-start'>
									<ImageIcon className='h-4 w-4 mr-2' />
									Portfolio
								</Button>
							</Link>
							<Link href={ROUTES.DASHBOARD_PROVIDER_REVIEWS}>
								<Button
									variant='outline'
									className='w-full justify-start'>
									<Star className='h-4 w-4 mr-2' />
									Reviews
								</Button>
							</Link>
							<Link href={ROUTES.DASHBOARD_PROVIDER_DOCUMENTS}>
								<Button
									variant='outline'
									className='w-full justify-start'>
									<FileText className='h-4 w-4 mr-2' />
									Documents
								</Button>
							</Link>
						</div>
					</CardContent>
				</Card>

				<div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
					{/* Recent Proposals */}
					<Card>
						<CardHeader>
							<div className='flex items-center justify-between'>
								<h2 className='text-lg font-semibold text-gray-900 dark:text-white'>Recent Proposals</h2>
								<Link href={ROUTES.DASHBOARD_MY_PROPOSALS}>
									<Button
										variant='outline'
										size='sm'>
										View All
									</Button>
								</Link>
							</div>
						</CardHeader>
						<CardContent>
							{proposalsLoading ?
								<div className='space-y-3'>
									{[...Array(3)].map((_, i) => (
										<SkeletonListItem key={i} />
									))}
								</div>
							: proposalList.length > 0 ?
								<div className='space-y-3'>
									{proposalList.slice(0, 5).map((proposal: any) => (
										<div
											key={proposal.id}
											className='p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:border-blue-200 dark:hover:border-blue-700 transition-all'>
											<div className='flex items-start justify-between gap-3'>
												<div className='flex-1 min-w-0'>
													<h3 className='font-medium text-gray-900 dark:text-white truncate'>
														Proposal #{proposal.display_id || proposal.id.substring(0, 8)}
													</h3>
													<p className='text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-1'>
														{proposal.message}
													</p>
													<p className='text-xs text-gray-400 dark:text-gray-500 mt-1.5'>
														{formatCurrency(proposal.price)} &bull; {formatDate(proposal.created_at)}
													</p>
												</div>
												<StatusBadge status={proposal.status} />
											</div>
										</div>
									))}
								</div>
							:	<EmptyState
									title='No proposals yet'
									description='Browse open service requests and submit your first proposal.'
									icon='search'
									action={{ label: "Browse Requests", onClick: () => router.push(ROUTES.DASHBOARD_BROWSE_REQUESTS) }}
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
							: activeJobsList.length > 0 ?
								<div className='space-y-3'>
									{activeJobsList
										.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
										.slice(0, 5)
										.map((job: any) => (
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
															{job.customer?.name || "Customer"}
														</p>
														<p className='text-xs text-gray-400 dark:text-gray-500 mt-1.5'>
															{formatCurrency(job.actual_amount || 0)} &bull; {formatDate(job.created_at)}
														</p>
													</div>
													<StatusBadge status={job.status} />
												</div>
											</Link>
										))}
								</div>
							:	<EmptyState
									title='No active jobs'
									description='Accepted proposals will show here as active jobs.'
									icon='inbox'
									action={{ label: "Browse Requests", onClick: () => router.push(ROUTES.DASHBOARD_BROWSE_REQUESTS) }}
								/>
							}
						</CardContent>
					</Card>
				</div>

				{/* Earnings Overview */}
				<Card className='mt-8'>
					<CardHeader>
						<div className='flex items-center justify-between'>
							<h2 className='text-lg font-semibold text-gray-900 dark:text-white'>Earnings Overview</h2>
							<Link href={ROUTES.DASHBOARD_EARNINGS}>
								<Button
									variant='outline'
									size='sm'>
									View Details
								</Button>
							</Link>
						</div>
					</CardHeader>
					<CardContent>
						<div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
							<div className='p-4 bg-green-50 dark:bg-green-900/20 rounded-lg'>
								<p className='text-sm font-medium text-green-800 dark:text-green-300'>Completed Jobs</p>
								<p className='text-2xl font-bold text-green-900 dark:text-green-200 mt-2'>{completedJobs.length}</p>
							</div>
							<div className='p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg'>
								<p className='text-sm font-medium text-blue-800 dark:text-blue-300'>Jobs in Progress</p>
								<p className='text-2xl font-bold text-blue-900 dark:text-blue-200 mt-2'>{activeJobs}</p>
							</div>
							<div className='p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg'>
								<p className='text-sm font-medium text-purple-800 dark:text-purple-300'>Pending Proposals</p>
								<p className='text-2xl font-bold text-purple-900 dark:text-purple-200 mt-2'>{pendingProposals}</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</Layout>
	);
}
