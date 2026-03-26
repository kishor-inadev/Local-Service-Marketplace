'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/config/constants';
import { Layout } from '@/components/layout/Layout';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { ErrorState } from "@/components/ui/ErrorState";
import { requestService } from '@/services/request-service';
import { formatDate, formatCurrency } from '@/utils/helpers';
import { Search, Filter, MapPin, Calendar, DollarSign } from 'lucide-react';
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";

export default function BrowseRequestsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('open');

  // Fetch all open requests (marketplace view for providers)
  const {
		data: requests,
		isLoading,
		error,
		refetch,
	} = useQuery({
		queryKey: ["browse-requests", statusFilter, selectedCategory],
		queryFn: () =>
			requestService.getRequests({
				status: statusFilter || undefined,
				category_id: selectedCategory || undefined,
				limit: 50,
			}),
		enabled: isAuthenticated && user?.role === "provider",
	});

  const { data: categories } = useQuery({
		queryKey: ["categories"],
		queryFn: () => requestService.getCategories(),
		enabled: isAuthenticated,
	});

  // Filter requests locally by search term
  const filteredRequests = requests?.data?.filter((request: any) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      request.description?.toLowerCase().includes(searchLower) ||
      request.location?.address?.toLowerCase().includes(searchLower) ||
      request.category?.name?.toLowerCase().includes(searchLower)
    );
  }) || [];

  return (
		<ProtectedRoute requiredRoles={["provider"]}>
			<Layout>
				<div className='container-custom py-12'>
					{error ?
						<ErrorState
							title='Failed to load requests'
							message="We couldn't load service requests. Please try again."
							retry={() => refetch()}
						/>
					:	<>
							{/* Header */}
							<div className='mb-8'>
								<h1 className='text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-2'>
									Browse Service Requests
								</h1>
								<p className='text-lg text-gray-600 dark:text-gray-400'>Find new opportunities and submit proposals</p>
							</div>

							{/* Filters */}
							<Card className='mb-6'>
								<CardContent className='p-4'>
									<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
										{/* Search */}
										<div className='relative'>
											<Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
											<input
												type='text'
												placeholder='Search requests...'
												className='w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:text-white'
												value={searchTerm}
												onChange={(e) => setSearchTerm(e.target.value)}
											/>
										</div>

										{/* Status Filter */}
										<div>
											<select
												className='w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:text-white'
												value={statusFilter}
												onChange={(e) => setStatusFilter(e.target.value)}>
												<option value=''>All Statuses</option>
												<option value='open'>Open</option>
												<option value='in_progress'>In Progress</option>
												<option value='completed'>Completed</option>
											</select>
										</div>

										{/* Category Filter */}
										<div>
											<select
												className='w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:text-white'
												value={selectedCategory}
												onChange={(e) => setSelectedCategory(e.target.value)}>
												<option value=''>All Categories</option>
												{categories?.map((cat: any) => (
													<option
														key={cat.id}
														value={cat.id}>
														{cat.name}
													</option>
												))}
											</select>
										</div>
									</div>
								</CardContent>
							</Card>

							{/* Results */}
							{isLoading ?
								<Loading />
							: filteredRequests.length > 0 ?
								<div className='space-y-4'>
									{filteredRequests.map((request: any) => (
										<Card
											key={request.id}
											hover>
											<CardContent className='p-6'>
												<div className='flex items-start justify-between'>
													<div className='flex-1'>
														{/* Header */}
														<div className='flex items-start justify-between mb-3'>
															<div>
																<h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-1'>
																	Request #{request.id.substring(0, 8)}
																</h3>
																{request.category && (
																	<span className='inline-block px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded'>
																		{request.category.name}
																	</span>
																)}
															</div>
															<StatusBadge status={request.status} />
														</div>

														{/* Description */}
														<p className='text-gray-700 dark:text-gray-300 mb-4 line-clamp-3'>{request.description}</p>

														{/* Meta Info */}
														<div className='grid grid-cols-1 md:grid-cols-3 gap-3 mb-4'>
															<div className='flex items-center text-sm text-gray-600 dark:text-gray-400'>
																<DollarSign className='h-4 w-4 mr-2' />
																<span>Budget: {formatCurrency(request.budget)}</span>
															</div>
															{request.location && (
																<div className='flex items-center text-sm text-gray-600 dark:text-gray-400'>
																	<MapPin className='h-4 w-4 mr-2' />
																	<span>{request.location.city || "Location"}</span>
																</div>
															)}
															<div className='flex items-center text-sm text-gray-600 dark:text-gray-400'>
																<Calendar className='h-4 w-4 mr-2' />
																<span>Posted {formatDate(request.created_at)}</span>
															</div>
														</div>

														{/* Customer Info */}
														{request.user_id && (
															<div className='flex items-center text-sm text-gray-600 dark:text-gray-400 mb-4'>
																<span>Customer: {request.customer?.name || "Anonymous"}</span>
															</div>
														)}

														{/* Proposal Count */}
														{request.proposal_count > 0 && (
															<div className='text-sm text-gray-500 dark:text-gray-400'>
																{request.proposal_count} proposal{request.proposal_count !== 1 ? "s" : ""} submitted
															</div>
														)}
													</div>

													{/* Action */}
													<div className='ml-4'>
														<Button
															size='sm'
															onClick={() => router.push(`/requests/${request.id}`)}>
															View Details
														</Button>
													</div>
												</div>
											</CardContent>
										</Card>
									))}
								</div>
							:	<Card>
									<CardContent className='text-center py-12'>
										<Filter className='h-12 w-12 text-gray-400 mx-auto mb-4' />
										<h3 className='text-lg font-medium text-gray-900 dark:text-white mb-2'>No requests found</h3>
										<p className='text-gray-600 dark:text-gray-400'>Try adjusting your filters to see more results</p>
									</CardContent>
								</Card>
							}

							{/* Results Summary */}
							{!isLoading && filteredRequests.length > 0 && (
								<div className='mt-6 text-center text-sm text-gray-600 dark:text-gray-400'>
									Showing {filteredRequests.length} request{filteredRequests.length !== 1 ? "s" : ""}
								</div>
							)}
						</>
					}
				</div>
			</Layout>
		</ProtectedRoute>
	);
}
