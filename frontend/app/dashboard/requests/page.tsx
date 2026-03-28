'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/config/constants';
import { Layout } from '@/components/layout/Layout';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/Badge';
import { ErrorState } from "@/components/ui/ErrorState";
import { Pagination } from '@/components/ui/Pagination';
import { RequestFilters } from '@/components/features/requests/RequestFilters';
import { usePagination } from '@/hooks/usePagination';
import { requestService } from '@/services/request-service';
import { formatDate, formatCurrency } from '@/utils/helpers';
import { analytics } from '@/utils/analytics';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";

export default function RequestsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { page, limit, goToPage } = usePagination();
  const [filters, setFilters] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(ROUTES.LOGIN);
    }
  }, [isAuthenticated, authLoading, router]);

  const { data, isLoading, error, refetch } = useQuery({
		queryKey: ["requests", page, limit, filters],
		queryFn: () => requestService.getRequests({ page, limit, ...filters }),
	});

  useEffect(() => {
    analytics.pageview({
      path: '/requests',
      title: 'Service Requests',
    });
  }, []);

  const handleFilterChange = (newFilters: Record<string, any>) => {
    setFilters(newFilters);
    goToPage(1); // Reset to first page on filter change
  };

  const handleClearFilters = () => {
    setFilters({});
    goToPage(1);
  };

  if (authLoading) {
    return <Loading />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
		<ProtectedRoute requiredRoles={["customer"]}>
			<Layout>
				<div className='container-custom py-12'>
					{error ?
						<ErrorState
							title='Failed to load requests'
							message="We couldn't load your service requests. Please try again."
							retry={() => refetch()}
						/>
					:	<>
							<div className='flex items-center justify-between mb-10'>
								<div>
									<h1 className='text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-3'>
										Service Requests
									</h1>
									<p className='text-lg text-gray-600 dark:text-gray-400'>Browse and manage service requests</p>
								</div>
								<Link href={ROUTES.CREATE_REQUEST}>
									<Button>
										<Plus className='h-4 w-4 mr-2' />
										New Request
									</Button>
								</Link>
							</div>

							{/* Filters */}
							<RequestFilters
								onFilterChange={handleFilterChange}
								onClear={handleClearFilters}
								activeFilters={filters}
							/>

							{/* Loading State with Skeletons */}
							{isLoading ?
								<div className='grid gap-6'>
									{[...Array(5)].map((_, i) => (
										<Card key={i}>
											<CardContent>
												<div className='space-y-3'>
													<Skeleton
														width='60%'
														height='24px'
													/>
													<Skeleton count={2} />
													<div className='flex gap-4'>
														<Skeleton width='80px' />
														<Skeleton width='100px' />
														<Skeleton width='120px' />
													</div>
												</div>
											</CardContent>
										</Card>
									))}
								</div>
							: data && Array.isArray(data.data) && data.data.length > 0 ?
								<>
									<div className='grid gap-6'>
										{data.data.map((request) => (
											<Card
												key={request.id}
												hover>
												<CardContent>
													<div className='flex items-start justify-between'>
														<div className='flex-1'>
															<Link href={`/requests/${request.id}`}>
																<h3 className='text-lg font-semibold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400'>
																	Request #{request.id.substring(0, 8)}
																</h3>
															</Link>
															<p className='text-gray-600 dark:text-gray-400 mt-2 line-clamp-2'>
																{request.description}
															</p>
															<div className='flex items-center gap-4 mt-4 text-sm text-gray-500 dark:text-gray-400'>
																<span className='font-medium text-gray-900 dark:text-white'>
																	{formatCurrency(request.budget)}
																</span>
																<span>•</span>
																<span>{request.category?.name || "Uncategorized"}</span>
																<span>•</span>
																<span>{formatDate(request.created_at)}</span>
															</div>
														</div>
														<StatusBadge status={request.status} />
													</div>
												</CardContent>
											</Card>
										))}
									</div>

									{data.hasMore && (
										<Pagination
											currentPage={page}
											totalPages={page + 2}
											onPageChange={goToPage}
										/>
									)}
								</>
							:	<Card>
									<CardContent>
										<div className='text-center py-12'>
											<p className='text-gray-500 dark:text-gray-400 mb-4'>No requests found</p>
											<Link href={ROUTES.CREATE_REQUEST}>
												<Button>Create Your First Request</Button>
											</Link>
										</div>
									</CardContent>
								</Card>
							}
						</>
					}
				</div>
			</Layout>
		</ProtectedRoute>
	);
}
