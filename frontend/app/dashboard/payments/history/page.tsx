'use client';

import { useEffect, useMemo, useState } from "react";
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { usePagination } from "@/hooks/usePagination";
import { ROUTES } from '@/config/constants';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from "@/components/ui/Pagination";
import { StatusBadge } from '@/components/ui/Badge';
import { paymentService } from '@/services/payment-service';
import { formatDate, formatCurrency } from '@/utils/helpers';
import { analytics } from '@/utils/analytics';
import toast from 'react-hot-toast';
import { ErrorState } from "@/components/ui/ErrorState";
import { ArrowDown, ArrowUp, ArrowUpDown, IndianRupee, Download } from "lucide-react";

type PaymentSortField = "created_at" | "amount" | "status";

export default function PaymentHistoryPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
	const [sortField, setSortField] = useState<PaymentSortField>("created_at");
	const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
	const { page, limit, setLimit, goToPage } = usePagination({ initialLimit: 10 });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(ROUTES.LOGIN);
    }
  }, [isAuthenticated, authLoading, router]);
  const {
		data: payments,
		isLoading,
		error,
		refetch,
	} = useQuery({
		queryKey: ["payment-history"],
		queryFn: () => paymentService.getMyPayments(),
		enabled: isAuthenticated,
	});

	const sortedPayments = useMemo(() => {
		const list = [...(payments || [])];
		list.sort((a: any, b: any) => {
			const direction = sortDirection === "asc" ? 1 : -1;

			if (sortField === "created_at") {
				return (new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()) * direction;
			}

			if (sortField === "amount") {
				return ((a.amount || 0) - (b.amount || 0)) * direction;
			}

			const left = String(a.status || "").toLowerCase();
			const right = String(b.status || "").toLowerCase();
			return left.localeCompare(right) * direction;
		});
		return list;
	}, [payments, sortDirection, sortField]);

	const numberFormatter = useMemo(() => new Intl.NumberFormat("en-US"), []);

	const totalPages = Math.max(1, Math.ceil(sortedPayments.length / limit));
	const paginatedPayments = useMemo(() => {
		const start = (page - 1) * limit;
		return sortedPayments.slice(start, start + limit);
	}, [sortedPayments, page, limit]);
	const startRow = sortedPayments.length === 0 ? 0 : (page - 1) * limit + 1;
	const endRow = sortedPayments.length === 0 ? 0 : Math.min(page * limit, sortedPayments.length);

	useEffect(() => {
		goToPage(1);
	}, [sortField, sortDirection, limit, goToPage]);

	useEffect(() => {
		if (page > totalPages) {
			goToPage(totalPages);
		}
	}, [page, totalPages, goToPage]);

	const handleSort = (field: PaymentSortField) => {
		if (field === sortField) {
			setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
			return;
		}
		setSortField(field);
		setSortDirection(field === "created_at" ? "desc" : "asc");
	};

	const sortIcon = (field: PaymentSortField) => {
		if (sortField !== field) {
			return <ArrowUpDown className='h-4 w-4 text-gray-400' />;
		}
		return sortDirection === "asc" ?
				<ArrowUp className='h-4 w-4 text-primary-600 dark:text-primary-400' />
			:	<ArrowDown className='h-4 w-4 text-primary-600 dark:text-primary-400' />;
	};

  useEffect(() => {
    analytics.pageview({
      path: '/payments/history',
      title: 'Payment History',
    });
  }, []);

  if (authLoading) {
    return <Loading />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
		<Layout>
			<div className='container-custom py-8'>
				<div className='flex items-center justify-between mb-8'>
					<div>
						<h1 className='text-3xl font-bold text-gray-900 dark:text-gray-100'>Payment History</h1>
						<p className='mt-2 text-gray-600 dark:text-gray-400'>View all your payment transactions</p>
					</div>
					<div className='flex flex-wrap items-center gap-2'>
						<select
							value={sortField}
							onChange={(e) => handleSort(e.target.value as PaymentSortField)}
							className='h-9 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:focus:ring-primary-900'>
							<option value='created_at'>Sort by Date</option>
							<option value='amount'>Sort by Amount</option>
							<option value='status'>Sort by Status</option>
						</select>
					</div>
				</div>

				{isLoading ?
					<div className='space-y-4'>{Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}</div>
				: error ?
					<ErrorState
						title='Failed to load payments'
						message="We couldn't load your payment history. Please try again."
						retry={() => refetch()}
					/>
				: paginatedPayments.length > 0 ?
					<div className='space-y-4'>
						<div className='flex flex-wrap items-center gap-2 px-1 pb-2 text-xs text-gray-500 dark:text-gray-400'>
							<span className='font-medium'>Quick sort:</span>
							<button
								type='button'
								onClick={() => handleSort("created_at")}
								className='inline-flex items-center gap-1 rounded px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700'>
								Date {sortIcon("created_at")}
							</button>
							<button
								type='button'
								onClick={() => handleSort("amount")}
								className='inline-flex items-center gap-1 rounded px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700'>
								Amount {sortIcon("amount")}
							</button>
						</div>
						{paginatedPayments.map((payment: any) => (
							<Card
								key={payment.id}
								hover>
								<CardContent>
									<div className='flex items-center justify-between'>
										<div className='flex items-start gap-4 flex-1'>
											<div className='p-3 bg-primary-100 dark:bg-primary-900/20 rounded-lg'>
												<IndianRupee className='h-6 w-6 text-primary-600 dark:text-primary-400' />
											</div>

											<div className='flex-1'>
												<div className='flex items-center gap-3'>
													<h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
														{formatCurrency(payment.amount)}
													</h3>
													<StatusBadge status={payment.status} />
												</div>

												<div className='mt-2 space-y-1'>
													<p className='text-sm text-gray-600 dark:text-gray-400'>
														Job ID: #{payment.job_display_id || payment.job_id?.slice(0, 8)}
													</p>
													<p className='text-sm text-gray-600 dark:text-gray-400'>
															Transaction ID: #{payment.display_id || payment.id.slice(0, 8)}
													</p>
													<p className='text-sm text-gray-500 dark:text-gray-500'>{formatDate(payment.created_at)}</p>
												</div>

												{payment.status === "completed" && payment.transaction_id && (
													<div className='mt-3'>
														<p className='text-xs text-gray-500 dark:text-gray-500'>
															Transaction ID: {payment.transaction_id}
														</p>
													</div>
												)}

												{payment.status === "failed" && (
													<div className='mt-3 px-3 py-2 bg-red-50 dark:bg-red-900/20 rounded-md'>
														<p className='text-sm text-red-700 dark:text-red-400'>
															Payment failed. Please contact support if you have questions.
														</p>
													</div>
												)}
											</div>
										</div>

										<div className='flex flex-col items-end gap-2'>
											<button
												className='text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center gap-1'
												onClick={async () => {
													analytics.event({ action: "download_receipt", category: "engagement", label: payment.id });
													try {
														const response = await fetch(`/api/v1/payments/${payment.id}/invoice/download`, {
															credentials: 'include',
														});
														if (!response.ok) throw new Error('Failed to download');
														const blob = await response.blob();
														const url = window.URL.createObjectURL(blob);
														const a = document.createElement('a');
														a.href = url;
														a.download = `invoice-${payment.display_id || payment.id.slice(0, 8)}.html`;
														document.body.appendChild(a);
														a.click();
														window.URL.revokeObjectURL(url);
														document.body.removeChild(a);
														toast.success('Invoice downloaded');
													} catch {
														toast.error('Failed to download invoice');
													}
												}}>
												<Download className='h-4 w-4' />
												Receipt
											</button>
										</div>
									</div>
								</CardContent>
							</Card>
						))}
						<Pagination
							currentPage={page}
							totalPages={totalPages}
							onPageChange={goToPage}
							leftContent={
								<div className='flex flex-wrap items-center gap-3'>
									<div className='text-sm text-gray-600 dark:text-gray-300'>
										Showing {numberFormatter.format(startRow)}-{numberFormatter.format(endRow)} of{" "}
										{numberFormatter.format(sortedPayments.length)} records
									</div>
									<select
										value={limit}
										onChange={(e) => setLimit(Number(e.target.value))}
										className='h-9 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:focus:ring-primary-900'>
										<option value={10}>10 per page</option>
										<option value={20}>20 per page</option>
										<option value={50}>50 per page</option>
									</select>
								</div>
							}
						/>
					</div>
				:	<EmptyState
						title='No payments yet'
						description='Your payment history will appear here once you complete transactions.'
					/>
				}
			</div>
		</Layout>
	);
}
