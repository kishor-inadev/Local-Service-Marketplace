"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Layout } from "@/components/layout/Layout";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Loading } from "@/components/ui/Loading";
import { StatusBadge } from "@/components/ui/Badge";
import { ErrorState } from "@/components/ui/ErrorState";
import { adminService } from "@/services/admin-service";
import { formatDate } from "@/utils/helpers";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { ArrowLeft, FileText, Calendar, CheckCircle } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

const RESOLUTION_STATUSES = [
	{ value: "investigating", label: "Mark as Investigating" },
	{ value: "resolved", label: "Mark as Resolved" },
	{ value: "closed", label: "Close Dispute" },
];

export default function AdminDisputeDetailPage() {
	const params = useParams();
	const router = useRouter();
	const queryClient = useQueryClient();
	const { user: currentUser } = useAuth();
	const disputeId = params.id as string;

	const [resolution, setResolution] = useState("");
	const [newStatus, setNewStatus] = useState("resolved");

	const {
		data: dispute,
		isLoading,
		error,
		refetch,
	} = useQuery({
		queryKey: ["admin-dispute", disputeId],
		queryFn: () => adminService.getDisputeById(disputeId),
		enabled: !!disputeId && currentUser?.role === "admin",
	});

	const updateMutation = useMutation({
		mutationFn: () => adminService.updateDispute(disputeId, { status: newStatus, resolution: resolution || undefined }),
		onSuccess: () => {
			toast.success("Dispute updated successfully");
			queryClient.invalidateQueries({ queryKey: ["admin-dispute", disputeId] });
			queryClient.invalidateQueries({ queryKey: ["admin-disputes"] });
			router.push("/dashboard/admin/disputes");
		},
		onError: () => toast.error("Failed to update dispute"),
	});

	return (
		<ProtectedRoute requiredRoles={["admin"]}>
			<Layout>
				<div className='container-custom py-8'>
					{/* Back */}
					<Link
						href='/dashboard/admin/disputes'
						className='inline-flex items-center text-primary-600 hover:text-primary-700 mb-6'>
						<ArrowLeft className='h-4 w-4 mr-2' />
						Back to Disputes
					</Link>

					{isLoading ?
						<Loading />
					: error || !dispute ?
						<ErrorState
							title='Dispute not found'
							message="We couldn't find this dispute."
							retry={() => refetch()}
						/>
					:	<div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
							{/* Main */}
							<div className='lg:col-span-2 space-y-6'>
								<Card>
									<CardHeader>
										<div className='flex items-start justify-between'>
											<h1 className='text-2xl font-bold text-gray-900 dark:text-white'>
											Dispute #{dispute.display_id || dispute.id.slice(0, 8)}
											</h1>
											<StatusBadge status={dispute.status} />
										</div>
									</CardHeader>
									<CardContent>
										<div className='space-y-4'>
											<div className='flex items-start gap-3'>
												<FileText className='h-5 w-5 text-gray-400 mt-0.5' />
												<div>
													<p className='text-sm text-gray-500 dark:text-gray-400'>Reason</p>
													<p className='text-gray-900 dark:text-white mt-1'>{dispute.reason}</p>
												</div>
											</div>
											<div className='flex items-center gap-3'>
												<Calendar className='h-5 w-5 text-gray-400' />
												<div>
													<p className='text-sm text-gray-500 dark:text-gray-400'>Filed On</p>
													<p className='text-gray-900 dark:text-white'>{formatDate(dispute.created_at)}</p>
												</div>
											</div>
											{dispute.resolution && (
												<div className='flex items-start gap-3'>
													<CheckCircle className='h-5 w-5 text-green-500 mt-0.5' />
													<div>
														<p className='text-sm text-gray-500 dark:text-gray-400'>Resolution</p>
														<p className='text-gray-900 dark:text-white mt-1'>{dispute.resolution}</p>
													</div>
												</div>
											)}
											{dispute.resolved_at && (
												<div className='flex items-center gap-3'>
													<Calendar className='h-5 w-5 text-gray-400' />
													<div>
														<p className='text-sm text-gray-500 dark:text-gray-400'>Resolved On</p>
														<p className='text-gray-900 dark:text-white'>{formatDate(dispute.resolved_at)}</p>
													</div>
												</div>
											)}
										</div>
									</CardContent>
								</Card>

								{/* Resolution Form */}
								{dispute.status !== "resolved" && dispute.status !== "closed" && (
									<Card>
										<CardHeader>
											<h2 className='text-lg font-semibold text-gray-900 dark:text-white'>Update Status</h2>
										</CardHeader>
										<CardContent>
											<div className='space-y-4'>
												<div>
													<label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
														New Status
													</label>
													<select
														className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white'
														value={newStatus}
														onChange={(e) => setNewStatus(e.target.value)}>
														{RESOLUTION_STATUSES.map((s) => (
															<option
																key={s.value}
																value={s.value}>
																{s.label}
															</option>
														))}
													</select>
												</div>
												<div>
													<label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
														Resolution Notes
													</label>
													<textarea
														rows={4}
														className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white'
														placeholder='Describe the resolution or action taken...'
														value={resolution}
														onChange={(e) => setResolution(e.target.value)}
													/>
												</div>
												<Button
													onClick={() => updateMutation.mutate()}
													isLoading={updateMutation.isPending}
													disabled={updateMutation.isPending}>
													Update Dispute
												</Button>
											</div>
										</CardContent>
									</Card>
								)}
							</div>

							{/* Sidebar */}
							<div className='space-y-6'>
								<Card>
									<CardHeader>
										<h2 className='text-lg font-semibold text-gray-900 dark:text-white'>Info</h2>
									</CardHeader>
									<CardContent className='space-y-3 text-sm'>
										<div>
											<p className='text-gray-500 dark:text-gray-400'>Job ID</p>
											<p className='font-medium text-gray-900 dark:text-white'>#{dispute.job_id.slice(0, 8)}</p>
										</div>
										<div>
											<p className='text-gray-500 dark:text-gray-400'>Opened By</p>
											<p className='font-medium text-gray-900 dark:text-white'>#{dispute.opened_by.slice(0, 8)}</p>
										</div>
										<div>
											<p className='text-gray-500 dark:text-gray-400'>Current Status</p>
											<StatusBadge status={dispute.status} />
										</div>
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
