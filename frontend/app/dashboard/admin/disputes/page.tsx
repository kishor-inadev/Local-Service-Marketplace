'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from "@/hooks/useAuth";
import { Layout } from '@/components/layout/Layout';
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { DataTable } from "@/components/ui";
import { adminService } from '@/services/admin-service';
import { ErrorState } from "@/components/ui/ErrorState";
import { formatDate } from '@/utils/helpers';
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import Link from "next/link";
import { Loading } from "@/components/ui";
import { SkeletonTable } from '@/components/ui/Skeleton';
import { useMemo, useState } from "react";
import type { ColumnFiltersState, SortingState, Table } from "@tanstack/react-table";

type DisputeRow = { id: string; display_id?: string; job_id?: string; reason?: string; status: string; created_at: string };

const DISPUTE_STATUS_OPTIONS = ["open", "investigating", "resolved", "closed"] as const;

const DISPUTE_STATUS_LABELS: Record<(typeof DISPUTE_STATUS_OPTIONS)[number], string> = {
	open: "Open",
	investigating: "Investigating",
	resolved: "Resolved",
	closed: "Closed",
};

const mapDisputeSortBy = (field?: string): "createdAt" | "status" | "resolvedAt" => {
	switch (field) {
		case "status":
			return "status";
		default:
			return "createdAt";
	}
};


export default function AdminDisputesPage() {
  const { user } = useAuth();
	const [serverSorting, setServerSorting] = useState<SortingState>([{ id: "created_at", desc: true }]);
	const [serverFilters, setServerFilters] = useState<ColumnFiltersState>([]);
	const [serverPageIndex, setServerPageIndex] = useState(0);
	const [serverPageSize, setServerPageSize] = useState(10);
	const [paginationMode, setPaginationMode] = useState<"pagination" | "load-more">("pagination");
	const [cumulativeDisputes, setCumulativeDisputes] = useState<DisputeRow[]>([]);

	const statusFilter = String(serverFilters.find((f) => f.id === "status")?.value || "");
	const activeSort = serverSorting[0];

  const {
		data: disputes,
		isLoading,
		isFetching,
		error,
		refetch,
	} = useQuery({
		queryKey: ["admin-disputes", serverPageIndex, serverPageSize, statusFilter, activeSort?.id, activeSort?.desc],
		queryFn: () =>
			adminService.getDisputes({
				page: serverPageIndex + 1,
				limit: serverPageSize,
				status: statusFilter || undefined,
				sortBy: mapDisputeSortBy(activeSort?.id),
				sortOrder: activeSort?.desc ? "desc" : "asc",
			}),
		enabled: user?.role === "admin",
		placeholderData: (previousData) => previousData,
	});

	// Handle data accumulation for Load More mode
	useMemo(() => {
		if (!disputes?.data) return;

		if (paginationMode === "load-more") {
			setCumulativeDisputes((prev) => {
				if (serverPageIndex === 0) return disputes.data;
				const existingIds = new Set(prev.map(d => d.id));
				const newUnique = disputes.data.filter(d => !existingIds.has(d.id));
				return [...prev, ...newUnique];
			});
		} else {
			setCumulativeDisputes(disputes.data);
		}
	}, [disputes?.data, paginationMode, serverPageIndex]);

	const disputeList = cumulativeDisputes;

	const { data: disputeStats } = useQuery({
		queryKey: ["admin-disputes-stats"],
		queryFn: () => adminService.getDisputeStats(),
		enabled: user?.role === "admin",
		staleTime: 60_000,
	});

  return (
		<ProtectedRoute requiredRoles={["admin"]}>
			<Layout>
				<div className='container-custom py-12'>
					<div className='mb-8'>
						<h1 className='text-3xl font-bold text-gray-900 dark:text-white mb-2'>Dispute Management</h1>
						<p className='text-gray-600 dark:text-gray-400'>
							Review and resolve disputes between customers and providers
						</p>
					</div>

					<div className='mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5'>
						<Card>
							<CardContent className='p-4'>
								<p className='text-sm text-gray-600 dark:text-gray-400'>Total Disputes</p>
								<p className='mt-1 text-2xl font-bold text-gray-900 dark:text-white'>{disputeStats?.total ?? 0}</p>
							</CardContent>
						</Card>
						<Card>
							<CardContent className='p-4'>
								<p className='text-sm text-gray-600 dark:text-gray-400'>Open</p>
								<p className='mt-1 text-2xl font-bold text-gray-900 dark:text-white'>
									{disputeStats?.byStatus.open ?? 0}
								</p>
							</CardContent>
						</Card>
						<Card>
							<CardContent className='p-4'>
								<p className='text-sm text-gray-600 dark:text-gray-400'>Investigating</p>
								<p className='mt-1 text-2xl font-bold text-gray-900 dark:text-white'>
									{disputeStats?.byStatus.investigating ?? 0}
								</p>
							</CardContent>
						</Card>
						<Card>
							<CardContent className='p-4'>
								<p className='text-sm text-gray-600 dark:text-gray-400'>Resolved</p>
								<p className='mt-1 text-2xl font-bold text-gray-900 dark:text-white'>
									{disputeStats?.byStatus.resolved ?? 0}
								</p>
							</CardContent>
						</Card>
						<Card>
							<CardContent className='p-4'>
								<p className='text-sm text-gray-600 dark:text-gray-400'>Closed</p>
								<p className='mt-1 text-2xl font-bold text-gray-900 dark:text-white'>
									{disputeStats?.byStatus.closed ?? 0}
								</p>
							</CardContent>
						</Card>
					</div>

					<Card>
						<CardHeader>
							<h2 className='text-lg font-semibold text-gray-900 dark:text-white'>
								All Disputes ({disputes?.total || disputeList.length})
							</h2>
						</CardHeader>
						<CardContent>
							{isLoading && !disputes ?
								<SkeletonTable rows={6} />
							: error ?
								<ErrorState
									title='Failed to load disputes'
									message="We couldn't load dispute data. Please try again."
									retry={() => refetch()}
								/>
							:	<DataTable<DisputeRow>
									data={disputeList}
									getRowKey={(row: DisputeRow) => row.id}
									processingMode='server'
									serverTotalRows={disputes?.total ?? disputeList.length}
									serverPageIndex={serverPageIndex}
									serverPageSize={serverPageSize}
									serverSorting={serverSorting}
									serverColumnFilters={serverFilters}
									onServerPageIndexChange={setServerPageIndex}
									onServerPageSizeChange={setServerPageSize}
									initialSortDirection='desc'
									defaultPaginationMode={paginationMode}
									onLoadMore={() => setPaginationMode("load-more")}
									enableSearch={false}
									renderToolbarFields={(table: Table<DisputeRow>) => {
										return (
											<select
												value={(table.getColumn("status")?.getFilterValue() as string) || ""}
												onChange={(e) => table.getColumn("status")?.setFilterValue(e.target.value || undefined)}
												className='rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200'>
												<option value=''>All statuses</option>
												{DISPUTE_STATUS_OPTIONS.map((status) => (
													<option
														key={status}
														value={status}>
														{DISPUTE_STATUS_LABELS[status]} (
														{disputeStats?.byStatus[status as keyof typeof disputeStats.byStatus] ?? 0})
													</option>
												))}
											</select>
										);
									}}
									quickSorts={[
										{ label: "Newest Filed", field: "created_at", direction: "desc" },
										{ label: "Oldest Filed", field: "created_at", direction: "asc" },
										{ label: "Status (A-Z)", field: "status", direction: "asc" },
									]}
									quickSortLabel='Quick sort'
									enableExport
									exportLabel='Export Disputes'
									exportFileName='admin-disputes'
									emptyMessage='No disputes found'
									isLoading={isFetching && !!disputes}
									searchDebounceMs={300}
									columns={[
										{
											id: "id",
											header: "Dispute ID",
											sortable: true,
											cell: (row: DisputeRow) => (
												<span className='font-mono text-xs font-medium text-gray-500 dark:text-gray-400'>
													{row.display_id || row.id.slice(0, 8)}
												</span>
											),
										},
										{
											id: "job_id",
											header: "Job ID",
											accessor: (row: DisputeRow) => row.job_id || "",
											cell: (row: DisputeRow) => (row.job_id ? row.job_id.slice(0, 8) : "-"),
										},
										{
											id: "reason",
											header: "Reason",
											cell: (row: DisputeRow) => (
												<span className='line-clamp-2 text-gray-700 dark:text-gray-300'>
													{row.reason || "No description provided"}
												</span>
											),
										},
										{
											id: "status",
											header: "Status",
											sortable: true,
											filterable: true,
											accessor: (row: DisputeRow) => row.status,
											cell: (row: DisputeRow) => <StatusBadge status={row.status} />,
											align: "center",
										},
										{
											id: "created_at",
											header: "Filed Date",
											sortable: true,
											accessor: (row: DisputeRow) => new Date(row.created_at),
											cell: (row: DisputeRow) => formatDate(row.created_at),
										},
										{
											id: "action",
											header: "Action",
											align: "right",
											cell: (row: DisputeRow) => (
										<Link href={`/dashboard/admin/disputes/${row.display_id || row.id}`}>
													<Button
														variant='outline'
														size='sm'>
														Review Dispute
													</Button>
												</Link>
											),
										},
									]}
								/>
							}
						</CardContent>
					</Card>
				</div>
			</Layout>
		</ProtectedRoute>
	);
}
