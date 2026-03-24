'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/config/constants';
import { Layout } from '@/components/layout/Layout';
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { adminService } from '@/services/admin-service';
import { formatDate } from '@/utils/helpers';
import Link from 'next/link';
import { ErrorState } from "@/components/ui/ErrorState";
import { Users, AlertCircle, Settings, FileText, TrendingUp } from 'lucide-react';
import { Loading } from "@/components/ui/Loading";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";

export default function AdminDashboardPage() {
  const { user } = useAuth();

  const {
		data: users,
		isLoading: usersLoading,
		error: usersError,
		refetch: refetchUsers,
	} = useQuery({ queryKey: ["admin-users"], queryFn: () => adminService.getUsers(), enabled: user?.role === "admin" });

  const {
		data: disputes,
		isLoading: disputesLoading,
		error: disputesError,
	} = useQuery({
		queryKey: ["admin-disputes"],
		queryFn: () => adminService.getDisputes(),
		enabled: user?.role === "admin",
	});

  const totalUsers = users?.length || 0;
  const activeDisputes = disputes?.filter((d: any) => d.status === 'open').length || 0;
  const totalDisputes = disputes?.length || 0;

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
							<div className='mb-12'>
								<h1 className='text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-3'>
									Admin Dashboard
								</h1>
								<p className='text-lg text-gray-600 dark:text-gray-400'>Manage users, disputes, and system settings</p>
							</div>

							{/* Stats Cards */}
							<div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-12'>
								<Card hover>
									<CardContent className='flex items-center justify-between p-6'>
										<div>
											<p className='text-sm font-medium text-gray-600 dark:text-gray-400'>Total Users</p>
											<p className='text-2xl font-bold text-gray-900 dark:text-white mt-2'>{totalUsers}</p>
										</div>
										<Users className='h-8 w-8 text-blue-600' />
									</CardContent>
								</Card>

								<Card hover>
									<CardContent className='flex items-center justify-between p-6'>
										<div>
											<p className='text-sm font-medium text-gray-600 dark:text-gray-400'>Active Disputes</p>
											<p className='text-2xl font-bold text-gray-900 dark:text-white mt-2'>{activeDisputes}</p>
										</div>
										<AlertCircle className='h-8 w-8 text-red-600' />
									</CardContent>
								</Card>

								<Card hover>
									<CardContent className='flex items-center justify-between p-6'>
										<div>
											<p className='text-sm font-medium text-gray-600 dark:text-gray-400'>Total Disputes</p>
											<p className='text-2xl font-bold text-gray-900 dark:text-white mt-2'>{totalDisputes}</p>
										</div>
										<FileText className='h-8 w-8 text-yellow-600' />
									</CardContent>
								</Card>

								<Card hover>
									<CardContent className='flex items-center justify-between p-6'>
										<div>
											<p className='text-sm font-medium text-gray-600 dark:text-gray-400'>System Status</p>
											<p className='text-2xl font-bold text-green-600 dark:text-green-400 mt-2'>Healthy</p>
										</div>
										<TrendingUp className='h-8 w-8 text-green-600' />
									</CardContent>
								</Card>
							</div>

							{/* Quick Actions */}
							<Card className='mb-8'>
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
										: users && users.length > 0 ?
											<div className='space-y-3'>
												{users.slice(0, 5).map((user: any) => (
													<div
														key={user.id}
														className='flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-md'>
														<div>
															<p className='font-medium text-gray-900 dark:text-white'>{user.name || user.email}</p>
															<p className='text-sm text-gray-600 dark:text-gray-400'>{user.email}</p>
															<p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
																Role: {user.role} • Joined {formatDate(user.created_at)}
															</p>
														</div>
														<StatusBadge status={user.status || "active"} />
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
										: disputes && disputes.length > 0 ?
											<div className='space-y-3'>
												{disputes.slice(0, 5).map((dispute: any) => (
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
															{dispute.description || "No description"}
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
