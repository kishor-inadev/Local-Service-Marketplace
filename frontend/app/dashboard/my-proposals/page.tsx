'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/config/constants';
import { Layout } from '@/components/layout/Layout';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { ErrorState } from "@/components/ui/ErrorState";
import { proposalService } from '@/services/proposal-service';
import { formatDate, formatCurrency } from '@/utils/helpers';
import { FileText, Calendar, DollarSign, AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";

export default function MyProposalsPage() {
	const queryClient = useQueryClient();
	const { user, isAuthenticated } = useAuth();
	const router = useRouter();
	const [statusFilter, setStatusFilter] = useState<string>("");

	// Fetch provider's proposals
	const {
		data: proposals,
		isLoading,
		error,
		refetch,
	} = useQuery({
		queryKey: ["my-proposals"],
		queryFn: () => proposalService.getMyProposals(),
		enabled: isAuthenticated && user?.role === "provider",
	});

	// Withdraw proposal mutation
	const withdrawMutation = useMutation({
		mutationFn: (proposalId: string) => proposalService.withdrawProposal(proposalId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["my-proposals"] });
		},
	});

	// Filter proposals by status
	const filteredProposals =
		proposals?.filter((proposal: any) => {
			if (!statusFilter) return true;
			return proposal.status === statusFilter;
		}) || [];

	// Group proposals by status
	const proposalStats = {
		pending: proposals?.filter((p: any) => p.status === "pending").length || 0,
		accepted: proposals?.filter((p: any) => p.status === "accepted").length || 0,
		rejected: proposals?.filter((p: any) => p.status === "rejected").length || 0,
		withdrawn: proposals?.filter((p: any) => p.status === "withdrawn").length || 0,
	};

	const handleWithdraw = (proposalId: string) => {
		if (confirm("Are you sure you want to withdraw this proposal?")) {
			withdrawMutation.mutate(proposalId);
		}
	};

	return (
		<ProtectedRoute requiredRoles={["provider"]}>
			<Layout>
				<div className='container-custom py-12'>
					{error ?
						<ErrorState
							title='Failed to load proposals'
							message="We couldn't load your proposals. Please try again."
							retry={() => refetch()}
						/>
					:	<>
							{/* Header */}
							<div className='mb-8'>
								<h1 className='text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-2'>My Proposals</h1>
								<p className='text-lg text-gray-600 dark:text-gray-400'>Track and manage your submitted proposals</p>
							</div>

							{/* Stats Overview */}
							<div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-8'>
								<Card hover>
									<CardContent className='p-4'>
										<div className='flex items-center justify-between'>
											<div>
												<p className='text-sm text-gray-600 dark:text-gray-400'>Pending</p>
												<p className='text-2xl font-bold text-yellow-600'>{proposalStats.pending}</p>
											</div>
											<Clock className='h-8 w-8 text-yellow-600' />
										</div>
									</CardContent>
								</Card>

								<Card hover>
									<CardContent className='p-4'>
										<div className='flex items-center justify-between'>
											<div>
												<p className='text-sm text-gray-600 dark:text-gray-400'>Accepted</p>
												<p className='text-2xl font-bold text-green-600'>{proposalStats.accepted}</p>
											</div>
											<CheckCircle className='h-8 w-8 text-green-600' />
										</div>
									</CardContent>
								</Card>

								<Card hover>
									<CardContent className='p-4'>
										<div className='flex items-center justify-between'>
											<div>
												<p className='text-sm text-gray-600 dark:text-gray-400'>Rejected</p>
												<p className='text-2xl font-bold text-red-600'>{proposalStats.rejected}</p>
											</div>
											<XCircle className='h-8 w-8 text-red-600' />
										</div>
									</CardContent>
								</Card>

								<Card hover>
									<CardContent className='p-4'>
										<div className='flex items-center justify-between'>
											<div>
												<p className='text-sm text-gray-600 dark:text-gray-400'>Withdrawn</p>
												<p className='text-2xl font-bold text-gray-600'>{proposalStats.withdrawn}</p>
											</div>
											<AlertCircle className='h-8 w-8 text-gray-600' />
										</div>
									</CardContent>
								</Card>
							</div>

							{/* Filter */}
							<Card className='mb-6'>
								<CardContent className='p-4'>
									<div className='flex items-center gap-4'>
										<label className='text-sm font-medium text-gray-700 dark:text-gray-300'>Filter by status:</label>
										<select
											className='px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:text-white'
											value={statusFilter}
											onChange={(e) => setStatusFilter(e.target.value)}>
											<option value=''>All Statuses</option>
											<option value='pending'>Pending</option>
											<option value='accepted'>Accepted</option>
											<option value='rejected'>Rejected</option>
											<option value='withdrawn'>Withdrawn</option>
										</select>
									</div>
								</CardContent>
							</Card>

							{/* Proposals List */}
							{isLoading ?
								<Loading />
							: filteredProposals.length > 0 ?
								<div className='space-y-4'>
									{filteredProposals.map((proposal: any) => (
										<Card
											key={proposal.id}
											hover>
											<CardContent className='p-6'>
												<div className='flex items-start justify-between'>
													<div className='flex-1'>
														{/* Header */}
														<div className='flex items-start justify-between mb-3'>
															<div>
																<h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-1'>
																Proposal #{proposal.display_id || proposal.id.substring(0, 8)}
																</h3>
																<p className='text-sm text-gray-600 dark:text-gray-400'>
																	For Request #{proposal.request_id?.substring(0, 8)}
																</p>
															</div>
															<StatusBadge status={proposal.status} />
														</div>

														{/* Message */}
														<div className='mb-4'>
															<p className='text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>Cover Letter:</p>
															<p className='text-gray-700 dark:text-gray-300 line-clamp-3'>{proposal.message}</p>
														</div>

														{/* Details Grid */}
														<div className='grid grid-cols-1 md:grid-cols-3 gap-3 mb-4'>
															<div className='flex items-center text-sm text-gray-600 dark:text-gray-400'>
																<DollarSign className='h-4 w-4 mr-2' />
																<span>Bid: {formatCurrency(proposal.price)}</span>
															</div>
															{proposal.estimated_hours && (
																<div className='flex items-center text-sm text-gray-600 dark:text-gray-400'>
																	<Clock className='h-4 w-4 mr-2' />
																	<span>{proposal.estimated_hours} hours</span>
																</div>
															)}
															<div className='flex items-center text-sm text-gray-600 dark:text-gray-400'>
																<Calendar className='h-4 w-4 mr-2' />
																<span>Submitted {formatDate(proposal.created_at)}</span>
															</div>
														</div>

														{/* Timeline */}
														{(proposal.start_date || proposal.completion_date) && (
															<div className='mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-md'>
																<p className='text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
																	Proposed Timeline:
																</p>
																<div className='grid grid-cols-2 gap-3 text-sm text-gray-600 dark:text-gray-400'>
																	{proposal.start_date && (
																		<div>
																			<span className='font-medium'>Start:</span> {formatDate(proposal.start_date)}
																		</div>
																	)}
																	{proposal.completion_date && (
																		<div>
																			<span className='font-medium'>Complete:</span>{" "}
																			{formatDate(proposal.completion_date)}
																		</div>
																	)}
																</div>
															</div>
														)}

														{/* Rejection Reason */}
														{proposal.status === "rejected" && proposal.rejected_reason && (
															<div className='mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-md'>
																<p className='text-sm font-medium text-red-800 dark:text-red-300 mb-1'>
																	Rejection Reason:
																</p>
																<p className='text-sm text-red-700 dark:text-red-400'>{proposal.rejected_reason}</p>
															</div>
														)}
													</div>

													{/* Actions */}
													<div className='ml-4 flex flex-col gap-2'>
														<Button
															size='sm'
															variant='outline'
															onClick={() => router.push(`/requests/${proposal.request_id}`)}>
															View Request
														</Button>
														{proposal.status === "pending" && (
															<Button
																size='sm'
																variant='outline'
																onClick={() => handleWithdraw(proposal.id)}
																disabled={withdrawMutation.isPending}>
																{withdrawMutation.isPending ? "Withdrawing..." : "Withdraw"}
															</Button>
														)}
														{proposal.status === "accepted" && (
															<Button
																size='sm'
																onClick={() => router.push(ROUTES.DASHBOARD_JOBS)}>
																View Job
															</Button>
														)}
													</div>
												</div>
											</CardContent>
										</Card>
									))}
								</div>
							:	<Card>
									<CardContent className='text-center py-12'>
										<FileText className='h-12 w-12 text-gray-400 mx-auto mb-4' />
										<h3 className='text-lg font-medium text-gray-900 dark:text-white mb-2'>No proposals found</h3>
										<p className='text-gray-600 dark:text-gray-400 mb-4'>
											{statusFilter ? `No ${statusFilter} proposals` : "You haven't submitted any proposals yet"}
										</p>
										<Button onClick={() => router.push(ROUTES.DASHBOARD_BROWSE_REQUESTS)}>Browse Requests</Button>
									</CardContent>
								</Card>
							}

							{/* Results Summary */}
							{!isLoading && filteredProposals.length > 0 && (
								<div className='mt-6 text-center text-sm text-gray-600 dark:text-gray-400'>
									Showing {filteredProposals.length} of {proposals?.length || 0} proposal
									{proposals?.length !== 1 ? "s" : ""}
								</div>
							)}
						</>
					}
				</div>
			</Layout>
		</ProtectedRoute>
	);
}
