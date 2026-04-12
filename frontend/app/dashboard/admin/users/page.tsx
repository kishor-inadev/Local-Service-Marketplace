'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { Permission } from "@/utils/permissions";
import { Layout } from '@/components/layout/Layout';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';

import { SkeletonTable } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { DataTable } from "@/components/ui";
import { adminService } from '@/services/admin-service';
import { formatDate } from '@/utils/helpers';
import { ErrorState } from "@/components/ui/ErrorState";
import { useMemo, useState } from "react";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/config/constants";
import type { ColumnFiltersState, SortingState, Table } from "@tanstack/react-table";

type UserRow = { id: string; display_id?: string; name?: string; email?: string; role?: string; status?: string; created_at: string };

const USER_ROLE_OPTIONS = ["customer", "provider", "admin"] as const;
const USER_STATUS_OPTIONS = ["active", "suspended"] as const;

const ROLE_LABELS: Record<(typeof USER_ROLE_OPTIONS)[number], string> = {
	customer: "Customer",
	provider: "Provider",
	admin: "Admin",
};

const STATUS_LABELS: Record<(typeof USER_STATUS_OPTIONS)[number], string> = {
	active: "Active",
	suspended: "Suspended",
};

const mapUserSortBy = (field?: string): "createdAt" | "email" | "name" | "role" | "lastLoginAt" => {
	switch (field) {
		case "email":
			return "email";
		case "name":
			return "name";
		case "role":
			return "role";
		default:
			return "createdAt";
	}
};

export default function AdminUsersPage() {
  const { user } = useAuth();
  const { can } = usePermissions();
	const router = useRouter();
	const [serverSearch, setServerSearch] = useState("");
	const [serverSorting, setServerSorting] = useState<SortingState>([{ id: "created_at", desc: true }]);
	const [serverFilters, setServerFilters] = useState<ColumnFiltersState>([]);
	const [serverPageIndex, setServerPageIndex] = useState(0);
	const [serverPageSize, setServerPageSize] = useState(10);
	const [paginationMode, setPaginationMode] = useState<"pagination" | "load-more">("pagination");
	const [cumulativeUsers, setCumulativeUsers] = useState<UserRow[]>([]);

	const roleFilter = String(serverFilters.find((f) => f.id === "role")?.value || "");
	const statusFilter = String(serverFilters.find((f) => f.id === "status")?.value || "");
	const activeSort = serverSorting[0];

  const {
		data: users,
		isLoading,
		isFetching,
		error,
		refetch,
	} = useQuery({
		queryKey: [
			"admin-users",
			serverPageIndex,
			serverPageSize,
			serverSearch,
			roleFilter,
			statusFilter,
			activeSort?.id,
			activeSort?.desc,
		],
		queryFn: () =>
			adminService.getUsers({
				page: serverPageIndex + 1,
				limit: serverPageSize,
				search: serverSearch || undefined,
				role: roleFilter || undefined,
				status: statusFilter || undefined,
				sortBy: mapUserSortBy(activeSort?.id),
				sortOrder: activeSort?.desc ? "desc" : "asc",
			}),
		enabled: can(Permission.USERS_LIST),
		placeholderData: (previousData) => previousData,
	});

	// Handle data accumulation for Load More mode
	useMemo(() => {
		if (!users?.data) return;

		if (paginationMode === "load-more") {
			setCumulativeUsers((prev) => {
				// If we're on the first page, reset the list
				if (serverPageIndex === 0) return users.data;
				
				// Prevent duplicates (though unlikely with proper pagination)
				const existingIds = new Set(prev.map(u => u.id));
				const newUnique = users.data.filter(u => !existingIds.has(u.id));
				return [...prev, ...newUnique];
			});
		} else {
			setCumulativeUsers(users.data);
		}
	}, [users?.data, paginationMode, serverPageIndex]);

	const tableUsers = cumulativeUsers;

	const { data: userStats } = useQuery({
		queryKey: ["admin-users-stats"],
		queryFn: () => adminService.getSystemStats(),
		enabled: can(Permission.USERS_LIST),
		staleTime: 60_000,
	});

  return (
		<ProtectedRoute requiredPermissions={[Permission.USERS_LIST]}>
			<Layout>
				<div className='container-custom py-12'>
					<div className='mb-8'>
						<h1 className='text-3xl font-bold text-gray-900 dark:text-white mb-2'>User Management</h1>
						<p className='text-gray-600 dark:text-gray-400'>Manage and monitor platform users</p>
					</div>

					<div className='mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
						<Card>
							<CardContent className='p-4'>
								<p className='text-sm text-gray-600 dark:text-gray-400'>Total Users</p>
								<p className='mt-1 text-2xl font-bold text-gray-900 dark:text-white'>{userStats?.total ?? 0}</p>
							</CardContent>
						</Card>
						<Card>
							<CardContent className='p-4'>
								<p className='text-sm text-gray-600 dark:text-gray-400'>Active Users</p>
								<p className='mt-1 text-2xl font-bold text-gray-900 dark:text-white'>
									{userStats?.byStatus.active ?? 0}
								</p>
							</CardContent>
						</Card>
						<Card>
							<CardContent className='p-4'>
								<p className='text-sm text-gray-600 dark:text-gray-400'>Suspended Users</p>
								<p className='mt-1 text-2xl font-bold text-gray-900 dark:text-white'>
									{userStats?.byStatus.suspended ?? 0}
								</p>
							</CardContent>
						</Card>
						<Card>
							<CardContent className='p-4'>
								<p className='text-sm text-gray-600 dark:text-gray-400'>Customers</p>
								<p className='mt-1 text-2xl font-bold text-gray-900 dark:text-white'>
									{userStats?.byRole.customer ?? 0}
								</p>
							</CardContent>
						</Card>
						<Card>
							<CardContent className='p-4'>
								<p className='text-sm text-gray-600 dark:text-gray-400'>Providers</p>
								<p className='mt-1 text-2xl font-bold text-gray-900 dark:text-white'>
									{userStats?.byRole.provider ?? 0}
								</p>
							</CardContent>
						</Card>
						<Card>
							<CardContent className='p-4'>
								<p className='text-sm text-gray-600 dark:text-gray-400'>Admins</p>
								<p className='mt-1 text-2xl font-bold text-gray-900 dark:text-white'>{userStats?.byRole.admin ?? 0}</p>
							</CardContent>
						</Card>
					</div>

					{/* Users List */}
					<Card>
						<CardHeader>
							<h2 className='text-lg font-semibold text-gray-900 dark:text-white'>
								All Users ({users?.total ?? tableUsers.length})
							</h2>
						</CardHeader>
						<CardContent>
							{isLoading && !users ?
								<SkeletonTable rows={8} />
							: error ?
								<ErrorState
									title='Failed to load users'
									message="We couldn't load user data. Please try again."
									retry={() => refetch()}
								/>
							:	<DataTable<UserRow>
									data={tableUsers}
									getRowKey={(row: UserRow) => row.id}
									processingMode='server'
									serverTotalRows={users?.total ?? tableUsers.length}
									serverPageIndex={serverPageIndex}
									serverPageSize={serverPageSize}
									serverSearchTerm={serverSearch}
									serverSorting={serverSorting}
									serverColumnFilters={serverFilters}
									onServerPageIndexChange={setServerPageIndex}
									onServerPageSizeChange={setServerPageSize}
									onServerSearchChange={setServerSearch}
									onServerSortingChange={setServerSorting}
									onServerColumnFiltersChange={setServerFilters}
									initialSortDirection='desc'
									defaultPaginationMode={paginationMode}
									onLoadMore={() => setPaginationMode("load-more")}
									searchPlaceholder='Search users by name, email, role, or status...'
									searchableColumns={["display_id", "name", "email", "role", "status", "created_at"]}
									renderToolbarFields={(table: Table<UserRow>) => {
										return (
											<>
												<select
													value={(table.getColumn("role")?.getFilterValue() as string) || ""}
													onChange={(e) => table.getColumn("role")?.setFilterValue(e.target.value || undefined)}
													className='rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200'>
													<option value=''>All roles</option>
													{USER_ROLE_OPTIONS.map((role) => (
														<option
															key={role}
															value={role}>
															{ROLE_LABELS[role]} ({userStats?.byRole[role as keyof typeof userStats.byRole] ?? 0})
														</option>
													))}
												</select>

												<select
													value={(table.getColumn("status")?.getFilterValue() as string) || ""}
													onChange={(e) => table.getColumn("status")?.setFilterValue(e.target.value || undefined)}
													className='rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200'>
													<option value=''>All statuses</option>
													{USER_STATUS_OPTIONS.map((status) => (
														<option
															key={status}
															value={status}>
															{STATUS_LABELS[status]} (
															{userStats?.byStatus[status as keyof typeof userStats.byStatus] ?? 0})
														</option>
													))}
												</select>
											</>
										);
									}}
									quickSorts={[
										{ label: "Name (A-Z)", field: "name", direction: "asc" },
										{ label: "Email (A-Z)", field: "email", direction: "asc" },
										{ label: "Newest Joined", field: "created_at", direction: "desc" },
										{ label: "Oldest Joined", field: "created_at", direction: "asc" },
									]}
									quickSortLabel='Quick sort'
									enableExport
									exportLabel='Export Users'
									exportFileName='admin-users'
									emptyMessage='No users found'
									emptyActionLabel='Create User'
									onEmptyAction={() => router.push(ROUTES.DASHBOARD_ADMIN_USERS_CREATE)}
									showEmptyAction={can(Permission.USERS_CREATE)}
									isLoading={isFetching && !!users}
									searchDebounceMs={300}
									columns={[
										{
											id: "id",
											header: "ID",
											sortable: true,
											cell: (row: UserRow) => (
												<span className='font-mono text-xs font-medium text-gray-500 dark:text-gray-400'>
													{row.display_id || row.id.slice(0, 8)}
												</span>
											),
										},
										{
											id: "name",
											header: "Name",
											sortable: true,
											accessor: (row: UserRow) => row.name || "",
											cell: (row: UserRow) => <span className='font-medium'>{row.name || "No name"}</span>,
										},
										{
											id: "email",
											header: "Email",
											sortable: true,
											accessor: (row: UserRow) => row.email || "",
											cell: (row: UserRow) => row.email || "-",
										},
										{
											id: "role",
											header: "Role",
											sortable: true,
											filterable: true,
											accessor: (row: UserRow) => row.role || "",
											cell: (row: UserRow) => (
												<span className='rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200'>
													{row.role}
												</span>
											),
											align: "center",
										},
										{
											id: "status",
											header: "Status",
											sortable: true,
											filterable: true,
											accessor: (row: UserRow) => row.status || "active",
											cell: (row: UserRow) => <StatusBadge status={row.status || "active"} />,
											align: "center",
										},
										{
											id: "created_at",
											header: "Joined",
											sortable: true,
											accessor: (row: UserRow) => new Date(row.created_at),
											cell: (row: UserRow) => formatDate(row.created_at),
										},
										{
											id: "action",
											header: "Action",
											align: "right",
											cell: (row: UserRow) => (
										<Link href={`/dashboard/admin/users/${row.id}`}>
													<Button
														variant='outline'
														size='sm'>
														View Details
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
