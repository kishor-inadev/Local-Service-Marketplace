"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { Permission } from "@/utils/permissions";
import { Layout } from "@/components/layout/Layout";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Loading } from "@/components/ui/Loading";
import { StatusBadge } from "@/components/ui/Badge";
import { ErrorState } from "@/components/ui/ErrorState";
import { adminService } from "@/services/admin-service";
import { formatDate } from "@/utils/helpers";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { ArrowLeft, User, Mail, Shield, Calendar, Ban, CheckCircle, Phone, Globe, Clock, Languages, Fingerprint } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";

export default function AdminUserDetailPage() {
	const params = useParams();
	const router = useRouter();
	const queryClient = useQueryClient();
	const { user: _currentUser } = useAuth();
	const { can } = usePermissions();
	const userId = params.id as string;
	const [suspendReason, setSuspendReason] = useState("");
	const [showSuspendForm, setShowSuspendForm] = useState(false);

	const {
		data: user,
		isLoading,
		error,
		refetch,
	} = useQuery({
		queryKey: ["admin-user", userId],
		queryFn: () => adminService.getUserById(userId),
		enabled: !!userId && can(Permission.USERS_READ),
	});

	const suspendMutation = useMutation({
		mutationFn: () => {
			if (!user?.id) {
				throw new Error("User UUID is not available");
			}
			return adminService.suspendUser(user.id, suspendReason);
		},
		onSuccess: () => {
			toast.success("User suspended successfully");
			queryClient.invalidateQueries({ queryKey: ["admin-user", userId] });
			queryClient.invalidateQueries({ queryKey: ["admin-users"] });
			setShowSuspendForm(false);
			setSuspendReason("");
		},
		onError: () => toast.error("Failed to suspend user"),
	});

	const activateMutation = useMutation({
		mutationFn: () => {
			if (!user?.id) {
				throw new Error("User UUID is not available");
			}
			return adminService.activateUser(user.id);
		},
		onSuccess: () => {
			toast.success("User activated successfully");
			queryClient.invalidateQueries({ queryKey: ["admin-user", userId] });
			queryClient.invalidateQueries({ queryKey: ["admin-users"] });
		},
		onError: () => toast.error("Failed to activate user"),
	});

	return (
		<ProtectedRoute requiredPermissions={[Permission.USERS_READ]}>
			<Layout>
				<div className='container-custom py-8'>
					{/* Back */}
					<Link
						href='/dashboard/admin/users'
						className='inline-flex items-center text-primary-600 hover:text-primary-700 mb-6'>
						<ArrowLeft className='h-4 w-4 mr-2' />
						Back to Users
					</Link>

					{isLoading ?
						<Loading />
					: error || !user ?
						<ErrorState
							title='User not found'
							message="We couldn't find this user."
							retry={() => refetch()}
						/>
					:	<div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
							{/* Main */}
							<div className='lg:col-span-2 space-y-6'>
								<Card>
									<CardHeader>
										<div className='flex items-center justify-between'>
											<div className="flex items-center gap-4">
												{user.profile_picture_url && (
													<Image 
														src={user.profile_picture_url} 
														alt={user.name || "User"} 
														width={64}
														height={64}
														className="rounded-full object-cover border-2 border-primary-100 shadow-sm"
													/>
												)}
												<div>
													<h1 className='text-2xl font-bold text-gray-900 dark:text-white'>
														{user.name || "User Details"}
													</h1>
													<p className="text-sm text-gray-500 font-mono">#{user.display_id || user.id.slice(0, 8)}</p>
												</div>
											</div>
											<div className="flex flex-col items-end gap-2">
												<StatusBadge status={user.status || "active"} />
												{user.email_verified && (
													<span className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
														<CheckCircle className="h-3 w-3" />
														Verified
													</span>
												)}
											</div>
										</div>
									</CardHeader>
									<CardContent>
										<div className='space-y-4'>
											<div className='flex items-center gap-3'>
												<User className='h-5 w-5 text-gray-400' />
												<div>
													<p className='text-sm text-gray-500 dark:text-gray-400'>Full Name</p>
													<p className='font-medium text-gray-900 dark:text-white'>{user.name || "No name"}</p>
												</div>
											</div>
											<div className='flex items-center gap-3'>
												<Mail className='h-5 w-5 text-gray-400' />
												<div>
													<p className='text-sm text-gray-500 dark:text-gray-400'>Email Address</p>
													<p className='font-medium text-gray-900 dark:text-white'>{user.email}</p>
												</div>
											</div>
											{user.phone && (
												<div className='flex items-center gap-3'>
													<Phone className='h-5 w-5 text-gray-400' />
													<div>
														<p className='text-sm text-gray-500 dark:text-gray-400'>Phone Number</p>
														<p className='font-medium text-gray-900 dark:text-white'>{user.phone}</p>
													</div>
												</div>
											)}
											<div className='flex items-center gap-3'>
												<Shield className='h-5 w-5 text-gray-400' />
												<div>
													<p className='text-sm text-gray-500 dark:text-gray-400'>Platform Role</p>
													<span className='inline-block px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded capitalize'>
														{user.role}
													</span>
												</div>
											</div>
											<div className='flex items-center gap-3'>
												<Languages className='h-5 w-5 text-gray-400' />
												<div>
													<p className='text-sm text-gray-500 dark:text-gray-400'>Preferred Language</p>
													<p className='font-medium text-gray-900 dark:text-white uppercase'>{user.language || "English (en)"}</p>
												</div>
											</div>
											<div className='flex items-center gap-3'>
												<Globe className='h-5 w-5 text-gray-400' />
												<div>
													<p className='text-sm text-gray-500 dark:text-gray-400'>Timezone</p>
													<p className='font-medium text-gray-900 dark:text-white'>{user.timezone || "N/A"}</p>
												</div>
											</div>
											<div className='flex items-center gap-3'>
												<Calendar className='h-5 w-5 text-gray-400' />
												<div>
													<p className='text-sm text-gray-500 dark:text-gray-400'>Member Since</p>
													<p className='font-medium text-gray-900 dark:text-white'>{formatDate(user.created_at)}</p>
												</div>
											</div>
											{user.last_login_at && (
												<div className='flex items-center gap-3'>
													<Clock className='h-5 w-5 text-gray-400' />
													<div>
														<p className='text-sm text-gray-500 dark:text-gray-400'>Last Login</p>
														<p className='font-medium text-gray-900 dark:text-white'>{formatDate(user.last_login_at)}</p>
													</div>
												</div>
											)}
										</div>
									</CardContent>
								</Card>

								{/* Suspend Form */}
								{showSuspendForm && (
									<Card>
										<CardHeader>
											<h2 className='text-lg font-semibold text-gray-900 dark:text-white'>Suspend User</h2>
										</CardHeader>
										<CardContent>
											<div className='space-y-4'>
												<div>
													<label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
														Reason for suspension
													</label>
													<textarea
														rows={3}
														className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white'
														placeholder='Provide a reason...'
														value={suspendReason}
														onChange={(e) => setSuspendReason(e.target.value)}
													/>
												</div>
												<div className='flex gap-3'>
													<Button
														variant='danger'
														onClick={() => suspendMutation.mutate()}
														disabled={!suspendReason.trim() || suspendMutation.isPending}
														isLoading={suspendMutation.isPending}>
														Confirm Suspension
													</Button>
													<Button
														variant='outline'
														onClick={() => setShowSuspendForm(false)}>
														Cancel
													</Button>
												</div>
											</div>
										</CardContent>
									</Card>
								)}
							</div>

							{/* Sidebar — Actions */}
							<div className='space-y-6'>
								<Card>
									<CardHeader>
										<h2 className='text-lg font-semibold text-gray-900 dark:text-white'>Actions</h2>
									</CardHeader>
									<CardContent className='space-y-4'>
										<div>
											<p className='text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mb-1'>
												<Fingerprint className="h-3 w-3" />
												Internal ID
											</p>
											<p className='font-mono text-xs text-gray-700 dark:text-gray-300 break-all bg-gray-50 dark:bg-gray-800 p-2 rounded'>
												{user.id}
											</p>
										</div>
										<hr className="border-gray-100 dark:border-gray-800" />
										{user.status !== "suspended" ?
											<Button
												variant='danger'
												className='w-full'
												onClick={() => setShowSuspendForm(true)}
												disabled={showSuspendForm}>
												<Ban className='h-4 w-4 mr-2' />
												Suspend User
											</Button>
										:	<Button
												className='w-full border-green-500 text-green-600 hover:bg-green-50'
												variant="outline"
												onClick={() => activateMutation.mutate()}
												isLoading={activateMutation.isPending}>
												<CheckCircle className='h-4 w-4 mr-2' />
												Activate User
											</Button>
										}
										<Button
											variant='outline'
											className='w-full'
											onClick={() => router.push("/dashboard/admin/users")}>
											Back to Users
										</Button>
									</CardContent>
								</Card>
							</div>
						</div>
					}
				</div>
			</Layout>
		</ProtectedRoute>
	);
}
