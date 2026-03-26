'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from "@/hooks/useAuth";
import { Layout } from '@/components/layout/Layout';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { adminService } from '@/services/admin-service';
import { formatDate } from '@/utils/helpers';
import { ErrorState } from "@/components/ui/ErrorState";
import { Search } from 'lucide-react';
import { useState } from 'react';
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import Link from "next/link";

export default function AdminUsersPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  const {
		data: users,
		isLoading,
		error,
		refetch,
	} = useQuery({ queryKey: ["admin-users"], queryFn: () => adminService.getUsers(), enabled: user?.role === "admin" });

  const filteredUsers = users?.filter((u: any) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      u.email?.toLowerCase().includes(search) ||
      u.name?.toLowerCase().includes(search) ||
      u.role?.toLowerCase().includes(search)
    );
  }) || [];

  return (
		<ProtectedRoute requiredRoles={["admin"]}>
			<Layout>
				<div className='container-custom py-12'>
					<div className='mb-8'>
						<h1 className='text-3xl font-bold text-gray-900 dark:text-white mb-2'>User Management</h1>
						<p className='text-gray-600 dark:text-gray-400'>Manage and monitor platform users</p>
					</div>

					{/* Search */}
					<div className='mb-6'>
						<div className='relative'>
							<Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400' />
							<input
								type='text'
								placeholder='Search users by name, email, or role...'
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className='w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
							/>
						</div>
					</div>

					{/* Users List */}
					<Card>
						<CardHeader>
							<h2 className='text-lg font-semibold text-gray-900 dark:text-white'>
								All Users ({filteredUsers.length})
							</h2>
						</CardHeader>
						<CardContent>
							{isLoading ?
								<Loading size='sm' />
							: error ?
								<ErrorState
									title='Failed to load users'
									message="We couldn't load user data. Please try again."
									retry={() => refetch()}
								/>
							: filteredUsers.length > 0 ?
								<div className='space-y-3'>
									{filteredUsers.map((user: any) => (
										<div
											key={user.id}
											className='flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700'>
											<div className='flex-1'>
												<div className='flex items-center gap-2'>
													<p className='font-medium text-gray-900 dark:text-white'>{user.name || "No name"}</p>
													<span className='px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded'>
														{user.role}
													</span>
												</div>
												<p className='text-sm text-gray-600 dark:text-gray-400 mt-1'>{user.email}</p>
												<p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
													Joined {formatDate(user.created_at)}
												</p>
											</div>
											<div className='flex items-center gap-3'>
												<StatusBadge status={user.status || "active"} />
												<Link href={`/dashboard/admin/users/${user.id}`}>
													<Button
														variant='outline'
														size='sm'>
														View Details
													</Button>
												</Link>
											</div>
										</div>
									))}
								</div>
							:	<p className='text-center py-8 text-gray-500 dark:text-gray-400'>No users found</p>}
						</CardContent>
					</Card>
				</div>
			</Layout>
		</ProtectedRoute>
	);
}
