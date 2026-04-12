'use client';

import { useEffect, useMemo, useState } from "react";
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { usePagination } from "@/hooks/usePagination";
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/config/constants';
import { Layout } from '@/components/layout/Layout';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';

import { SkeletonTable } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { Pagination } from "@/components/ui/Pagination";
import { paymentService } from '@/services/payment-service';
import { getProviderProfileByUserId } from "@/services/user-service";
import { formatDate, formatCurrency } from '@/utils/helpers';
import { ErrorState } from "@/components/ui/ErrorState";
import { ArrowDown, ArrowUp, ArrowUpDown, Calendar, DollarSign, Download, TrendingUp } from "lucide-react";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";

type TransactionSortField = "date" | "id" | "customer" | "total_amount" | "platform_fee" | "provider_amount" | "status";

export default function EarningsPage() {
	const { user, isAuthenticated } = useAuth();
	const [dateRange, setDateRange] = useState<string>("all");
	const [sortField, setSortField] = useState<TransactionSortField>("date");
	const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
	const { page, limit, setLimit, goToPage } = usePagination({ initialLimit: 10 });
	const router = useRouter();

	const {
		data: provider,
		isLoading: providerLoading,
		error: providerError,
		refetch: refetchProvider,
	} = useQuery({
		queryKey: ["provider-profile-by-user", user?.id],
		queryFn: () => getProviderProfileByUserId(user!.id),
		enabled: isAuthenticated && user?.role === "provider" && !!user?.id,
	});

	const providerId = provider?.id ?? "";

	// Fetch provider's earnings from payment service
	const {
		data: earnings,
		isLoading: earningsLoading,
		error: earningsError,
		refetch: refetchEarnings,
	} = useQuery({
		queryKey: ["provider-earnings", dateRange],
		queryFn: () => {
			// Calculate date filters based on selected range
			let startDate: Date | undefined;
			let endDate: Date | undefined;
			const now = new Date();

			if (dateRange === "this_month") {
				startDate = new Date(now.getFullYear(), now.getMonth(), 1);
				endDate = now;
			} else if (dateRange === "last_month") {
				startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
				endDate = new Date(now.getFullYear(), now.getMonth(), 0);
			} else if (dateRange === "this_year") {
				startDate = new Date(now.getFullYear(), 0, 1);
				endDate = now;
			}

			return paymentService.getProviderEarnings(providerId, startDate, endDate);
		},
		enabled: isAuthenticated && user?.role === "provider" && !!providerId,
	});

	// Fetch transaction history
	const {
		data: transactions,
		isLoading: transactionsLoading,
		error: transactionsError,
		refetch: refetchTransactions,
	} = useQuery({
		queryKey: ["provider-transactions", providerId],
		queryFn: () => paymentService.getProviderTransactions(providerId, 50),
		enabled: isAuthenticated && user?.role === "provider" && !!providerId,
	});

	const {
		data: payouts,
		isLoading: payoutsLoading,
		error: payoutsError,
		refetch: refetchPayouts,
	} = useQuery({
		queryKey: ["provider-payouts", providerId],
		queryFn: () => paymentService.getProviderPayouts(providerId),
		enabled: isAuthenticated && user?.role === "provider" && !!providerId,
	});

	const isLoading = providerLoading || earningsLoading || transactionsLoading || payoutsLoading;

	const sortedTransactions = useMemo(() => {
		const source = transactions?.data || [];
		const list = [...source];

		list.sort((a, b) => {
			const direction = sortDirection === "asc" ? 1 : -1;

			if (sortField === "date") {
				const left = new Date(a.paid_at || a.created_at || 0).getTime();
				const right = new Date(b.paid_at || b.created_at || 0).getTime();
				return (left - right) * direction;
			}

			if (sortField === "total_amount" || sortField === "platform_fee" || sortField === "provider_amount") {
				return ((a[sortField] || 0) - (b[sortField] || 0)) * direction;
			}

			if (sortField === "id") {
				return a.id.localeCompare(b.id) * direction;
			}

			if (sortField === "customer") {
				return String(a.customer_name || "").localeCompare(String(b.customer_name || "")) * direction;
			}

			return String(a.status || "").localeCompare(String(b.status || "")) * direction;
		});

		return list;
	}, [transactions?.data, sortDirection, sortField]);

	const numberFormatter = useMemo(() => new Intl.NumberFormat("en-US"), []);

	const totalPages = Math.max(1, Math.ceil(sortedTransactions.length / limit));
	const paginatedTransactions = useMemo(() => {
		const start = (page - 1) * limit;
		return sortedTransactions.slice(start, start + limit);
	}, [sortedTransactions, page, limit]);
	const startRow = sortedTransactions.length === 0 ? 0 : (page - 1) * limit + 1;
	const endRow = sortedTransactions.length === 0 ? 0 : Math.min(page * limit, sortedTransactions.length);

	const payoutStatusStyles: Record<string, string> = {
		available: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200",
		pending: "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200",
		adjusted: "bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200",
	};

	useEffect(() => {
		goToPage(1);
	}, [dateRange, sortField, sortDirection, limit, goToPage]);

	useEffect(() => {
		if (page > totalPages) {
			goToPage(totalPages);
		}
	}, [page, totalPages, goToPage]);

	const handleSort = (field: TransactionSortField) => {
		if (field === sortField) {
			setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
			return;
		}

		setSortField(field);
		setSortDirection(field === "date" ? "desc" : "asc");
	};

	const sortIcon = (field: TransactionSortField) => {
		if (sortField !== field) {
			return <ArrowUpDown className='h-4 w-4 text-gray-400' />;
		}

		return sortDirection === "asc" ?
				<ArrowUp className='h-4 w-4 text-primary-600 dark:text-primary-400' />
			:	<ArrowDown className='h-4 w-4 text-primary-600 dark:text-primary-400' />;
	};

	return (
		<ProtectedRoute requiredRoles={["provider"]}>
			<Layout>
				<div className='container-custom py-12'>
					{providerError || earningsError || transactionsError || payoutsError ?
						<ErrorState
							title='Failed to load earnings'
							message="We couldn't load your earnings data. Please try again."
							retry={() => {
								refetchProvider();
								refetchEarnings();
								refetchTransactions();
								refetchPayouts();
							}}
						/>
					: !providerId ?
						<Card>
							<CardContent className='p-10 text-center'>
								<DollarSign className='h-12 w-12 text-gray-400 mx-auto mb-4' />
								<h2 className='text-xl font-semibold text-gray-900 dark:text-white mb-2'>Provider profile required</h2>
								<p className='text-gray-600 dark:text-gray-400'>
									Create or restore your provider profile to access earnings.
								</p>
							</CardContent>
						</Card>
					:	<>
							{/* Header */}
							<div className='mb-8'>
								<h1 className='text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-2'>
									Earnings Dashboard
								</h1>
								<p className='text-lg text-gray-600 dark:text-gray-400'>Track your income and payment history</p>
							</div>

							{/* Stats Overview */}
							<div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-8'>
								<Card hover>
									<CardContent className='p-6'>
										<div className='flex items-center justify-between mb-2'>
											<p className='text-sm font-medium text-gray-600 dark:text-gray-400'>Total Earnings</p>
											<DollarSign className='h-5 w-5 text-green-600 dark:text-green-400' />
										</div>
										<p className='text-3xl font-bold text-gray-900 dark:text-white'>
											{earnings ? formatCurrency(earnings.summary.total_earnings) : formatCurrency(0)}
										</p>
										<p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
											From {earnings?.summary.completed_count || 0} completed jobs
										</p>
									</CardContent>
								</Card>

								<Card hover>
									<CardContent className='p-6'>
										<div className='flex items-center justify-between mb-2'>
											<p className='text-sm font-medium text-gray-600 dark:text-gray-400'>Total Paid</p>
											<TrendingUp className='h-5 w-5 text-blue-600 dark:text-blue-400' />
										</div>
										<p className='text-3xl font-bold text-gray-900 dark:text-white'>
											{earnings ? formatCurrency(earnings.summary.total_paid) : formatCurrency(0)}
										</p>
										<p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>Payments received</p>
									</CardContent>
								</Card>

								<Card hover>
									<CardContent className='p-6'>
										<div className='flex items-center justify-between mb-2'>
											<p className='text-sm font-medium text-gray-600 dark:text-gray-400'>Average per Job</p>
											<DollarSign className='h-5 w-5 text-purple-600 dark:text-purple-400' />
										</div>
										<p className='text-3xl font-bold text-gray-900 dark:text-white'>
											{earnings ? formatCurrency(earnings.average_per_job) : formatCurrency(0)}
										</p>
										<p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>Across all jobs</p>
									</CardContent>
								</Card>

								<Card hover>
									<CardContent className='p-6'>
										<div className='flex items-center justify-between mb-2'>
											<p className='text-sm font-medium text-gray-600 dark:text-gray-400'>Pending Payout</p>
											<Calendar className='h-5 w-5 text-yellow-600 dark:text-yellow-400' />
										</div>
										<p className='text-3xl font-bold text-gray-900 dark:text-white'>
											{earnings ? formatCurrency(earnings.summary.pending_payout) : formatCurrency(0)}
										</p>
										<p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>Awaiting payout</p>
									</CardContent>
								</Card>
							</div>

							{/* Date Range Filter */}
							<Card className='mb-6'>
								<CardContent className='p-4'>
									<div className='flex items-center justify-between'>
										<div className='flex items-center gap-4'>
											<label className='text-sm font-medium text-gray-700 dark:text-gray-300'>Time Period:</label>
											<select
												className='px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:text-white'
												value={dateRange}
												onChange={(e) => setDateRange(e.target.value)}>
												<option value='all'>All Time</option>
												<option value='this_month'>This Month</option>
												<option value='last_month'>Last Month</option>
												<option value='this_year'>This Year</option>
												<option value='custom'>Custom Range</option>
											</select>
										</div>
										<Button
											variant='outline'
											size='sm'>
											<Download className='h-4 w-4 mr-2' />
											Export Report
										</Button>
									</div>
								</CardContent>
							</Card>

							{/* Monthly Earnings Breakdown */}
							{earnings && earnings.monthly.length > 0 && (
								<Card className='mb-6'>
									<CardHeader>
										<h2 className='text-lg font-semibold text-gray-900 dark:text-white'>Monthly Breakdown</h2>
									</CardHeader>
									<CardContent>
										<div className='grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4'>
											{earnings.monthly.map((month) => (
												<div
													key={month.month}
													className='p-3 bg-gray-50 dark:bg-gray-700 rounded-lg'>
													<p className='text-xs text-gray-600 dark:text-gray-400 mb-1'>
														{new Date(month.month + "-01").toLocaleDateString("en-US", {
															month: "short",
															year: "numeric",
														})}
													</p>
													<p className='text-lg font-semibold text-gray-900 dark:text-white'>
														{formatCurrency(month.earnings)}
													</p>
													<p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>{month.job_count} jobs</p>
												</div>
											))}
										</div>
									</CardContent>
								</Card>
							)}

							{/* Payout Ledger */}
							<Card className='mb-6'>
								<CardHeader>
									<div className='flex items-center justify-between gap-4'>
										<div>
											<h2 className='text-lg font-semibold text-gray-900 dark:text-white'>Payout Ledger</h2>
											<p className='text-sm text-gray-600 dark:text-gray-400'>
												Derived from completed, pending, and refunded payment records
											</p>
										</div>
										<p className='text-sm text-gray-500 dark:text-gray-400'>{payouts?.length || 0} entries</p>
									</div>
								</CardHeader>
								<CardContent>
									{payouts && payouts.length > 0 ?
										<div className='overflow-x-auto'>
											<table className='w-full'>
												<thead>
													<tr className='border-b border-gray-200 dark:border-gray-700'>
														<th className='py-3 px-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300'>
															Date
														</th>
														<th className='py-3 px-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300'>
															Method
														</th>
														<th className='py-3 px-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300'>
															Status
														</th>
														<th className='py-3 px-4 text-right text-sm font-medium text-gray-700 dark:text-gray-300'>
															Transactions
														</th>
														<th className='py-3 px-4 text-right text-sm font-medium text-gray-700 dark:text-gray-300'>
															Amount
														</th>
													</tr>
												</thead>
												<tbody>
													{payouts.map((payout) => (
														<tr
															key={payout.id}
															className='border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'>
															<td className='py-3 px-4 text-sm text-gray-900 dark:text-white'>
																{formatDate(payout.payout_date)}
															</td>
															<td className='py-3 px-4 text-sm capitalize text-gray-600 dark:text-gray-400'>
																{String(payout.payout_method || "card").replace("_", " ")}
															</td>
															<td className='py-3 px-4 text-sm'>
																<span
																	className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${payoutStatusStyles[payout.status] || "bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200"}`}>
																	{payout.status}
																</span>
															</td>
															<td className='py-3 px-4 text-right text-sm text-gray-900 dark:text-white'>
																{numberFormatter.format(payout.transaction_count)}
															</td>
															<td
																className={`py-3 px-4 text-right text-sm font-semibold ${payout.amount < 0 ? "text-orange-600 dark:text-orange-400" : "text-green-600 dark:text-green-400"}`}>
																{formatCurrency(payout.amount)}
															</td>
														</tr>
													))}
												</tbody>
											</table>
										</div>
									:	<div className='text-center py-8 text-gray-500 dark:text-gray-400'>No payout entries yet.</div>}
								</CardContent>
							</Card>

							{/* Earnings History */}
							<Card>
								<CardHeader>
									<div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
										<h2 className='text-lg font-semibold text-gray-900 dark:text-white'>Transaction History</h2>
										<div className='flex flex-wrap items-center gap-2'>
											<select
												value={sortField}
												onChange={(e) => handleSort(e.target.value as TransactionSortField)}
												className='h-9 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:focus:ring-primary-900'>
												<option value='date'>Sort by Date</option>
												<option value='provider_amount'>Sort by Earnings</option>
												<option value='total_amount'>Sort by Amount</option>
												<option value='status'>Sort by Status</option>
											</select>
										</div>
									</div>
								</CardHeader>
								<CardContent>
									{isLoading ?
										<SkeletonTable rows={5} />
									: paginatedTransactions.length > 0 ?
										<div className='overflow-x-auto'>
											<div className='mb-3 flex flex-wrap items-center gap-2 px-1 text-xs text-gray-500 dark:text-gray-400'>
												<span className='font-medium'>Quick sort:</span>
												<button
													type='button'
													onClick={() => handleSort("date")}
													className='inline-flex items-center gap-1 rounded px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700'>
													Date {sortIcon("date")}
												</button>
												<button
													type='button'
													onClick={() => handleSort("provider_amount")}
													className='inline-flex items-center gap-1 rounded px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700'>
													Earnings {sortIcon("provider_amount")}
												</button>
											</div>
											<table className='w-full'>
												<thead>
													<tr className='border-b border-gray-200 dark:border-gray-700'>
														<th className='text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300'>
															<button
																type='button'
																onClick={() => handleSort("date")}
																className='inline-flex items-center gap-1'>
																Date {sortIcon("date")}
															</button>
														</th>
														<th className='text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300'>
															<button
																type='button'
																onClick={() => handleSort("id")}
																className='inline-flex items-center gap-1'>
																Transaction ID {sortIcon("id")}
															</button>
														</th>
														<th className='text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300'>
															<button
																type='button'
																onClick={() => handleSort("customer")}
																className='inline-flex items-center gap-1'>
																Customer {sortIcon("customer")}
															</button>
														</th>
														<th className='text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300'>
															<button
																type='button'
																onClick={() => handleSort("total_amount")}
																className='inline-flex items-center justify-end gap-1'>
																Amount {sortIcon("total_amount")}
															</button>
														</th>
														<th className='text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300'>
															<button
																type='button'
																onClick={() => handleSort("platform_fee")}
																className='inline-flex items-center justify-end gap-1'>
																Platform Fee {sortIcon("platform_fee")}
															</button>
														</th>
														<th className='text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300'>
															<button
																type='button'
																onClick={() => handleSort("provider_amount")}
																className='inline-flex items-center justify-end gap-1'>
																Your Earnings {sortIcon("provider_amount")}
															</button>
														</th>
														<th className='text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300'>
															<button
																type='button'
																onClick={() => handleSort("status")}
																className='inline-flex items-center justify-end gap-1'>
																Status {sortIcon("status")}
															</button>
														</th>
													</tr>
												</thead>
												<tbody>
													{paginatedTransactions.map((transaction) => (
														<tr
															key={transaction.id}
															className='border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'>
															<td className='py-3 px-4 text-sm text-gray-900 dark:text-white'>
																{formatDate(transaction.paid_at || transaction.created_at)}
															</td>
															<td className='py-3 px-4 text-sm text-gray-600 dark:text-gray-400 font-mono'>
																#{transaction.id.substring(0, 8)}
															</td>
															<td className='py-3 px-4 text-sm text-gray-900 dark:text-white'>
																{transaction.customer_name || "Customer"}
															</td>
															<td className='py-3 px-4 text-sm text-right text-gray-900 dark:text-white'>
																{formatCurrency(transaction.total_amount)}
															</td>
															<td className='py-3 px-4 text-sm text-right text-red-600 dark:text-red-400'>
																-{formatCurrency(transaction.platform_fee)}
															</td>
															<td className='py-3 px-4 text-sm text-right font-semibold text-green-600 dark:text-green-400'>
																{formatCurrency(transaction.provider_amount)}
															</td>
															<td className='py-3 px-4 text-right'>
																<span
																	className={`inline-block px-2 py-1 text-xs font-medium rounded ${
																		transaction.status === "completed" ?
																			"bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
																		: transaction.status === "pending" ?
																			"bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200"
																		:	"bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200"
																	}`}>
																	{transaction.status}
																</span>
															</td>
														</tr>
													))}
												</tbody>
											</table>
											<div className='pt-4'>
												<Pagination
													currentPage={page}
													totalPages={totalPages}
													onPageChange={goToPage}
													leftContent={
														<div className='flex flex-wrap items-center gap-3'>
															<div className='text-sm text-gray-600 dark:text-gray-300'>
																Showing {numberFormatter.format(startRow)}-{numberFormatter.format(endRow)} of{" "}
																{numberFormatter.format(sortedTransactions.length)} records
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
										</div>
									:	<div className='text-center py-12'>
											<DollarSign className='h-12 w-12 text-gray-400 mx-auto mb-4' />
											<h3 className='text-lg font-medium text-gray-900 dark:text-white mb-2'>No earnings yet</h3>
											<p className='text-gray-600 dark:text-gray-400 mb-4'>Complete jobs to start earning</p>
											<Button onClick={() => router.push(ROUTES.DASHBOARD_BROWSE_REQUESTS)}>Browse Requests</Button>
										</div>
									}
								</CardContent>
							</Card>

							{/* Payout Methods Section */}
							<Card className='mt-6'>
								<CardHeader>
									<h2 className='text-lg font-semibold text-gray-900 dark:text-white'>Payout Methods</h2>
								</CardHeader>
								<CardContent>
									<div className='text-center py-8 text-gray-500 dark:text-gray-400'>
										<p>Payout method management will be available soon</p>
										<p className='text-sm mt-2'>Configure bank accounts and payment preferences</p>
									</div>
								</CardContent>
							</Card>
						</>
					}
				</div>
			</Layout>
		</ProtectedRoute>
	);
}
