"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/config/constants";
import { Layout } from "@/components/layout/Layout";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { adminService } from "@/services/admin-service";
import { formatDate } from "@/utils/helpers";
import Link from "next/link";
import { ErrorState } from "@/components/ui/ErrorState";
import { Users, AlertCircle, Settings, Briefcase, ClipboardList, CreditCard } from "lucide-react";
import { Loading } from "@/components/ui/Loading";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";

export default function AdminDashboardPage() {
	const { user } = useAuth();

	const {
		data: users,
		isLoading: usersLoading,
		error: usersError,
		refetch: refetchUsers,
	} = useQuery({
		queryKey: ["admin-users-recent"],
		queryFn: () => adminService.getUsers({ page: 1, limit: 5 }),
		enabled: user?.role === "admin",
	});

	const {
		data: disputes,
		isLoading: disputesLoading,
		error: disputesError,
	} = useQuery({
		queryKey: ["admin-disputes-recent"],
		queryFn: () => adminService.getDisputes({ page: 1, limit: 5 }),
		enabled: user?.role === "admin",
	});

	const { data: userStats } = useQuery({
		queryKey: ["admin-users-stats"],
		queryFn: () => adminService.getSystemStats(),
		enabled: user?.role === "admin",
		staleTime: 60_000,
	});

	const { data: disputeStats } = useQuery({
		queryKey: ["admin-disputes-stats"],
		queryFn: () => adminService.getDisputeStats(),
		enabled: user?.role === "admin",
		staleTime: 60_000,
	});

	const { data: jobStats } = useQuery({
		queryKey: ["admin-jobs-stats"],
		queryFn: () => adminService.getJobStats(),
		enabled: user?.role === "admin",
		staleTime: 60_000,
	});

	const { data: requestStats } = useQuery({
		queryKey: ["admin-requests-stats"],
		queryFn: () => adminService.getRequestStats(),
		enabled: user?.role === "admin",
		staleTime: 60_000,
	});

	const { data: paymentStats } = useQuery({
		queryKey: ["admin-payments-stats"],
		queryFn: () => adminService.getPaymentStats(),
		enabled: user?.role === "admin",
		staleTime: 60_000,
	});

	const totalUsers = userStats?.total ?? 0;
	const activeDisputes = disputeStats?.byStatus?.open ?? 0;
	const totalRevenue = paymentStats?.totalRevenue ?? 0;
	const totalRequests = requestStats?.total ?? 0;
	const totalJobs = jobStats?.total ?? 0;
	const completedJobs = jobStats?.byStatus?.completed ?? 0;
	const requestCompletionRate =
		totalRequests > 0 ? Math.round(((requestStats?.byStatus?.completed ?? 0) / totalRequests) * 100) : 0;
	const jobSuccessRate = totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : 0;
	const disputeRate = totalJobs > 0 ? Math.round(((jobStats?.byStatus?.disputed ?? 0) / totalJobs) * 100) : 0;

	return (
		<ProtectedRoute requiredRoles={["admin"]}>
			<Layout>
				<div className='container-custom py-12'>
					{usersError || disputesError ?
						<ErrorState
							title='Failed to load admin data'
							message="We couldn't load admin dashboard data. Please try again."
							retry={() => refetchUsers()}
						/>
					:	<>
							{/* Header */}
							<div className='mb-10'>
								<h1 className='text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-3'>
									Admin Dashboard
								</h1>
								<p className='text-lg text-gray-600 dark:text-gray-400'>Platform-wide overview and management</p>
							</div>

							{/* Top KPI Bar */}
							<div className='grid grid-cols-2 lg:grid-cols-5 gap-4 mb-10'>
								{[
									{
										label: "Total Users",
										value: totalUsers,
										icon: <Users className='h-5 w-5' />,
										color: "text-blue-600",
										bg: "bg-blue-50 dark:bg-blue-900/20",
									},
									{
										label: "Total Requests",
										value: requestStats?.total ?? "—",
										icon: <ClipboardList className='h-5 w-5' />,
										color: "text-purple-600",
										bg: "bg-purple-50 dark:bg-purple-900/20",
									},
									{
										label: "Total Jobs",
										value: jobStats?.total ?? "—",
										icon: <Briefcase className='h-5 w-5' />,
										color: "text-orange-600",
										bg: "bg-orange-50 dark:bg-orange-900/20",
									},
									{
										label: "Active Disputes",
										value: activeDisputes,
										icon: <AlertCircle className='h-5 w-5' />,
										color: "text-red-600",
										bg: "bg-red-50 dark:bg-red-900/20",
									},
									{
										label: "Total Revenue",
										value: `$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
										icon: <CreditCard className='h-5 w-5' />,
										color: "text-green-600",
										bg: "bg-green-50 dark:bg-green-900/20",
									},
								].map(({ label, value, icon, color, bg }) => (
									<Card
										key={label}
										hover>
										<CardContent className='p-5'>
											<div className={`inline-flex items-center justify-center w-9 h-9 rounded-lg mb-3 ${bg} ${color}`}>
												{icon}
											</div>
											<p className='text-2xl font-bold text-gray-900 dark:text-white'>{value}</p>
											<p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>{label}</p>
										</CardContent>
									</Card>
								))}
							</div>

							{/* Performance Insights */}
							<div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-10'>
								<Card>
									<CardContent className='p-5'>
										<p className='text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400'>
											Requests Completion
										</p>
										<div className='mt-2 flex items-end justify-between'>
											<p className='text-3xl font-bold text-gray-900 dark:text-white'>{requestCompletionRate}%</p>
											<span className='text-sm text-green-600'>Healthy</span>
										</div>
										<div className='mt-3 h-2 rounded-full bg-gray-100 dark:bg-gray-700'>
											<div
												className='h-2 rounded-full bg-green-500'
												style={{ width: `${requestCompletionRate}%` }}
											/>
										</div>
									</CardContent>
								</Card>

								<Card>
									<CardContent className='p-5'>
										<p className='text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400'>Jobs Success</p>
										<div className='mt-2 flex items-end justify-between'>
											<p className='text-3xl font-bold text-gray-900 dark:text-white'>{jobSuccessRate}%</p>
											<span className='text-sm text-blue-600'>Stable</span>
										</div>
										<div className='mt-3 h-2 rounded-full bg-gray-100 dark:bg-gray-700'>
											<div
												className='h-2 rounded-full bg-blue-500'
												style={{ width: `${jobSuccessRate}%` }}
											/>
										</div>
									</CardContent>
								</Card>

								<Card>
									<CardContent className='p-5'>
										<p className='text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400'>Dispute Pressure</p>
										<div className='mt-2 flex items-end justify-between'>
											<p className='text-3xl font-bold text-gray-900 dark:text-white'>{disputeRate}%</p>
											<span className='text-sm text-red-600'>{activeDisputes} open</span>
										</div>
										<div className='mt-3 h-2 rounded-full bg-gray-100 dark:bg-gray-700'>
											<div
												className='h-2 rounded-full bg-red-500'
												style={{ width: `${Math.min(disputeRate, 100)}%` }}
											/>
										</div>
									</CardContent>
								</Card>
							</div>

							{/* Service Breakdown */}
							<div className='mb-10'>
								<h2 className='text-lg font-semibold text-gray-900 dark:text-white mb-5'>Service Breakdown</h2>
								<div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6'>
									{/* Users */}
									<Card>
										<CardContent className='p-6'>
											<div className='flex items-center justify-between mb-5'>
												<div className='flex items-center gap-2.5'>
													<div className='flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30'>
														<Users className='h-4 w-4 text-blue-600 dark:text-blue-400' />
													</div>
													<div>
														<p className='font-semibold text-gray-900 dark:text-white text-sm'>Users</p>
														<p className='text-xs text-gray-400'>identity-service</p>
													</div>
												</div>
												<span className='text-2xl font-bold text-gray-900 dark:text-white'>
													{userStats?.total ?? "—"}
												</span>
											</div>
											<div className='space-y-3'>
												<div>
													<div className='flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1'>
														<span>Active</span>
														<span className='font-semibold text-gray-900 dark:text-white'>
															{userStats?.byStatus?.active ?? 0}
														</span>
													</div>
													<div className='w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5'>
														<div
															className='bg-green-500 h-1.5 rounded-full'
															style={{
																width: `${userStats && userStats.total > 0 ? Math.round((userStats.byStatus.active / userStats.total) * 100) : 0}%`,
															}}
														/>
													</div>
												</div>
												<div>
													<div className='flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1'>
														<span>Suspended</span>
														<span className='font-semibold text-gray-900 dark:text-white'>
															{userStats?.byStatus?.suspended ?? 0}
														</span>
													</div>
													<div className='w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5'>
														<div
															className='bg-red-400 h-1.5 rounded-full'
															style={{
																width: `${userStats && userStats.total > 0 ? Math.round((userStats.byStatus.suspended / userStats.total) * 100) : 0}%`,
															}}
														/>
													</div>
												</div>
											</div>
											<div className='mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 grid grid-cols-3 gap-1 text-center text-xs text-gray-500 dark:text-gray-400'>
												<div>
													<p className='font-bold text-sm text-gray-900 dark:text-white'>
														{userStats?.byRole?.customer ?? "—"}
													</p>
													<p>Customers</p>
												</div>
												<div>
													<p className='font-bold text-sm text-gray-900 dark:text-white'>
														{userStats?.byRole?.provider ?? "—"}
													</p>
													<p>Providers</p>
												</div>
												<div>
													<p className='font-bold text-sm text-gray-900 dark:text-white'>
														{userStats?.byRole?.admin ?? "—"}
													</p>
													<p>Admins</p>
												</div>
											</div>
										</CardContent>
									</Card>

									{/* Requests */}
									<Card>
										<CardContent className='p-6'>
											<div className='flex items-center justify-between mb-5'>
												<div className='flex items-center gap-2.5'>
													<div className='flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/30'>
														<ClipboardList className='h-4 w-4 text-purple-600 dark:text-purple-400' />
													</div>
													<div>
														<p className='font-semibold text-gray-900 dark:text-white text-sm'>Requests</p>
														<p className='text-xs text-gray-400'>marketplace-service</p>
													</div>
												</div>
												<span className='text-2xl font-bold text-gray-900 dark:text-white'>
													{requestStats?.total ?? "—"}
												</span>
											</div>
											<div className='space-y-2.5'>
												{(
													[
														{ label: "Open", value: requestStats?.byStatus?.open, dot: "bg-blue-500" },
														{ label: "Assigned", value: requestStats?.byStatus?.assigned, dot: "bg-yellow-500" },
														{ label: "Completed", value: requestStats?.byStatus?.completed, dot: "bg-green-500" },
														{ label: "Cancelled", value: requestStats?.byStatus?.cancelled, dot: "bg-gray-400" },
													] as const
												).map(({ label, value, dot }) => (
													<div
														key={label}
														className='flex items-center justify-between text-sm'>
														<span className='flex items-center gap-2 text-gray-600 dark:text-gray-400'>
															<span className={`w-2 h-2 rounded-full ${dot}`} />
															{label}
														</span>
														<span className='font-semibold text-gray-900 dark:text-white'>{value ?? "—"}</span>
													</div>
												))}
											</div>
											{requestStats && requestStats.total > 0 && (
												<div className='mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400'>
													<p>
														Completion rate:{" "}
														<span className='font-semibold text-green-600'>
															{Math.round(((requestStats.byStatus.completed ?? 0) / requestStats.total) * 100)}%
														</span>
													</p>
												</div>
											)}
										</CardContent>
									</Card>

									{/* Jobs */}
									<Card>
										<CardContent className='p-6'>
											<div className='flex items-center justify-between mb-5'>
												<div className='flex items-center gap-2.5'>
													<div className='flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-900/30'>
														<Briefcase className='h-4 w-4 text-orange-600 dark:text-orange-400' />
													</div>
													<div>
														<p className='font-semibold text-gray-900 dark:text-white text-sm'>Jobs</p>
														<p className='text-xs text-gray-400'>marketplace-service</p>
													</div>
												</div>
												<span className='text-2xl font-bold text-gray-900 dark:text-white'>
													{jobStats?.total ?? "—"}
												</span>
											</div>
											<div className='space-y-2.5'>
												{(
													[
														{ label: "Scheduled", value: jobStats?.byStatus?.scheduled, dot: "bg-blue-500" },
														{ label: "In Progress", value: jobStats?.byStatus?.in_progress, dot: "bg-yellow-500" },
														{ label: "Completed", value: jobStats?.byStatus?.completed, dot: "bg-green-500" },
														{ label: "Cancelled", value: jobStats?.byStatus?.cancelled, dot: "bg-gray-400" },
														{ label: "Disputed", value: jobStats?.byStatus?.disputed, dot: "bg-red-500" },
													] as const
												).map(({ label, value, dot }) => (
													<div
														key={label}
														className='flex items-center justify-between text-sm'>
														<span className='flex items-center gap-2 text-gray-600 dark:text-gray-400'>
															<span className={`w-2 h-2 rounded-full ${dot}`} />
															{label}
														</span>
														<span className='font-semibold text-gray-900 dark:text-white'>{value ?? "—"}</span>
													</div>
												))}
											</div>
											{jobStats && jobStats.total > 0 && (
												<div className='mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400'>
													<p>
														Success rate:{" "}
														<span className='font-semibold text-green-600'>
															{Math.round(((jobStats.byStatus.completed ?? 0) / jobStats.total) * 100)}%
														</span>
													</p>
												</div>
											)}
										</CardContent>
									</Card>

									{/* Payments */}
									<Card>
										<CardContent className='p-6'>
											<div className='flex items-center justify-between mb-5'>
												<div className='flex items-center gap-2.5'>
													<div className='flex h-9 w-9 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/30'>
														<CreditCard className='h-4 w-4 text-green-600 dark:text-green-400' />
													</div>
													<div>
														<p className='font-semibold text-gray-900 dark:text-white text-sm'>Payments</p>
														<p className='text-xs text-gray-400'>payment-service</p>
													</div>
												</div>
												<span className='text-2xl font-bold text-gray-900 dark:text-white'>
													{paymentStats?.total ?? "—"}
												</span>
											</div>
											<div className='mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800'>
												<p className='text-xs text-gray-500 dark:text-gray-400 mb-0.5'>Total Revenue</p>
												<p className='text-xl font-bold text-green-600'>
													$
													{paymentStats ?
														paymentStats.totalRevenue.toLocaleString(undefined, {
															minimumFractionDigits: 2,
															maximumFractionDigits: 2,
														})
													:	"—"}
												</p>
											</div>
											<div className='space-y-2.5'>
												{(
													[
														{ label: "Completed", value: paymentStats?.byStatus?.completed, dot: "bg-green-500" },
														{ label: "Pending", value: paymentStats?.byStatus?.pending, dot: "bg-yellow-500" },
														{ label: "Failed", value: paymentStats?.byStatus?.failed, dot: "bg-red-500" },
														{ label: "Refunded", value: paymentStats?.byStatus?.refunded, dot: "bg-gray-400" },
													] as const
												).map(({ label, value, dot }) => (
													<div
														key={label}
														className='flex items-center justify-between text-sm'>
														<span className='flex items-center gap-2 text-gray-600 dark:text-gray-400'>
															<span className={`w-2 h-2 rounded-full ${dot}`} />
															{label}
														</span>
														<span className='font-semibold text-gray-900 dark:text-white'>{value ?? "—"}</span>
													</div>
												))}
											</div>
										</CardContent>
									</Card>
								</div>
							</div>

							{/* Dispute Monitoring */}
							<div className='mb-10'>
								<h2 className='text-lg font-semibold text-gray-900 dark:text-white mb-5'>Dispute Monitoring</h2>
								<div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
									{(
										[
											{
												label: "Open",
												value: disputeStats?.byStatus?.open,
												color: "text-red-600",
												bg: "bg-red-50 dark:bg-red-900/20",
												border: "border-red-200 dark:border-red-800",
												sub: "Needs attention",
											},
											{
												label: "Investigating",
												value: disputeStats?.byStatus?.investigating,
												color: "text-yellow-600",
												bg: "bg-yellow-50 dark:bg-yellow-900/20",
												border: "border-yellow-200 dark:border-yellow-800",
												sub: "Under review",
											},
											{
												label: "Resolved",
												value: disputeStats?.byStatus?.resolved,
												color: "text-green-600",
												bg: "bg-green-50 dark:bg-green-900/20",
												border: "border-green-200 dark:border-green-800",
												sub: "Decision made",
											},
											{
												label: "Closed",
												value: disputeStats?.byStatus?.closed,
												color: "text-gray-600 dark:text-gray-300",
												bg: "bg-gray-50 dark:bg-gray-800",
												border: "border-gray-200 dark:border-gray-700",
												sub: "Finalised",
											},
										] as const
									).map(({ label, value, color, bg, border, sub }) => (
										<div
											key={label}
											className={`rounded-xl border p-5 ${bg} ${border}`}>
											<p className={`text-4xl font-bold ${color} mb-1`}>{value ?? "—"}</p>
											<p className='text-sm font-medium text-gray-700 dark:text-gray-300'>{label}</p>
											<p className='text-xs text-gray-500 dark:text-gray-400 mt-0.5'>{sub}</p>
										</div>
									))}
								</div>
							</div>

							{/* Quick Actions */}
							<Card className='mb-10'>
								<CardHeader>
									<h2 className='text-lg font-semibold text-gray-900 dark:text-white'>Quick Actions</h2>
								</CardHeader>
								<CardContent>
									<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
										<Link href={ROUTES.DASHBOARD_ADMIN_USERS}>
											<Button
												variant='outline'
												className='w-full justify-start'>
												<Users className='h-4 w-4 mr-2' />
												Manage Users
											</Button>
										</Link>
										<Link href={ROUTES.DASHBOARD_ADMIN_DISPUTES}>
											<Button
												variant='outline'
												className='w-full justify-start'>
												<AlertCircle className='h-4 w-4 mr-2' />
												Review Disputes
											</Button>
										</Link>
										<Link href={ROUTES.DASHBOARD_ADMIN_SETTINGS}>
											<Button
												variant='outline'
												className='w-full justify-start'>
												<Settings className='h-4 w-4 mr-2' />
												System Settings
											</Button>
										</Link>
									</div>
								</CardContent>
							</Card>

							{/* Recent Activity */}
							<div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
								{/* Recent Users */}
								<Card>
									<CardHeader>
										<div className='flex items-center justify-between'>
											<h2 className='text-lg font-semibold text-gray-900 dark:text-white'>Recent Users</h2>
											<Link href={ROUTES.DASHBOARD_ADMIN_USERS}>
												<Button
													variant='outline'
													size='sm'>
													View All
												</Button>
											</Link>
										</div>
									</CardHeader>
									<CardContent>
										{usersLoading ?
											<Loading size='sm' />
										: users?.data && users.data.length > 0 ?
											<div className='space-y-3'>
												{users.data.slice(0, 5).map((u: any) => (
													<div
														key={u.id}
														className='flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-md'>
														<div>
															<p className='font-medium text-gray-900 dark:text-white'>{u.name || u.email}</p>
															<p className='text-sm text-gray-600 dark:text-gray-400'>{u.email}</p>
															<p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
																Role: {u.role} &bull; Joined {formatDate(u.created_at)}
															</p>
														</div>
														<StatusBadge status={u.status || "active"} />
													</div>
												))}
											</div>
										:	<p className='text-center py-8 text-gray-500 dark:text-gray-400'>No users found</p>}
									</CardContent>
								</Card>

								{/* Recent Disputes */}
								<Card>
									<CardHeader>
										<div className='flex items-center justify-between'>
											<h2 className='text-lg font-semibold text-gray-900 dark:text-white'>Recent Disputes</h2>
											<Link href={ROUTES.DASHBOARD_ADMIN_DISPUTES}>
												<Button
													variant='outline'
													size='sm'>
													View All
												</Button>
											</Link>
										</div>
									</CardHeader>
									<CardContent>
										{disputesLoading ?
											<Loading size='sm' />
										: disputes?.data && disputes.data.length > 0 ?
											<div className='space-y-3'>
												{disputes.data.slice(0, 5).map((dispute: any) => (
													<div
														key={dispute.id}
														className='p-3 border border-gray-200 dark:border-gray-700 rounded-md'>
														<div className='flex items-start justify-between mb-2'>
															<p className='text-sm font-medium text-gray-900 dark:text-white'>
																Job #{dispute.job_id?.slice(0, 8)}
															</p>
															<StatusBadge status={dispute.status} />
														</div>
														<p className='text-sm text-gray-600 dark:text-gray-400 line-clamp-2'>
															{dispute.description || dispute.reason || "No description"}
														</p>
														<p className='text-xs text-gray-500 dark:text-gray-400 mt-2'>
															Filed {formatDate(dispute.created_at)}
														</p>
													</div>
												))}
											</div>
										:	<p className='text-center py-8 text-gray-500 dark:text-gray-400'>No disputes found</p>}
									</CardContent>
								</Card>
							</div>
						</>
					}
				</div>
			</Layout>
		</ProtectedRoute>
	);
}
