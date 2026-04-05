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
import { paymentService } from "@/services/payment-service";
import { formatDate } from "@/utils/helpers";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { ArrowLeft, FileText, Calendar, CheckCircle, AlertTriangle } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

const RESOLUTION_OUTCOMES = [
	{ value: "award_customer", label: "Award Customer (issue refund)", requiresRefund: true },
	{ value: "award_provider", label: "Award Provider (no refund)", requiresRefund: false },
	{ value: "investigating", label: "Mark as Investigating", requiresRefund: false },
	{ value: "closed", label: "Close Dispute (no action)", requiresRefund: false },
] as const;

type OutcomeValue = (typeof RESOLUTION_OUTCOMES)[number]["value"];

export default function AdminDisputeDetailPage() {
	const params = useParams();
	const router = useRouter();
	const queryClient = useQueryClient();
	const { user: currentUser } = useAuth();
	const disputeId = params.id as string;

	const [resolution, setResolution] = useState("");
	const [outcome, setOutcome] = useState<OutcomeValue>("award_customer");

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
		mutationFn: async () => {
			if (!dispute?.id) {
				throw new Error("Dispute UUID is not available");
			}

			const selectedOutcome = RESOLUTION_OUTCOMES.find((o) => o.value === outcome);
			const newStatus = outcome === "award_customer" || outcome === "award_provider" ? "resolved" : outcome;
			const resolutionNote = resolution.trim() || undefined;

			// If awarding the customer, trigger a refund first
			if (selectedOutcome?.requiresRefund && dispute.job_id) {
				try {
					const payments = await paymentService.getPaymentsByJob(dispute.job_id);
					const completedPayment = payments.find((p) => p.status === "completed");
					if (completedPayment) {
						await paymentService.requestRefund(completedPayment.id, {
							reason: resolutionNote ?? "Dispute resolved in customer's favour",
						});
						toast("Refund initiated for the associated payment", { icon: "💳" });
					}
				} catch (refundErr: any) {
					// Non-fatal: proceed with dispute update even if refund lookup fails
					const msg = refundErr?.response?.data?.message ?? refundErr?.message ?? "Refund error";
					toast(`Note: ${msg}`, { icon: "⚠️" });
				}
			}

			return adminService.updateDispute(dispute.id, { status: newStatus, resolution: resolutionNote });
		},
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
											<h2 className='text-lg font-semibold text-gray-900 dark:text-white'>Resolve Dispute</h2>
										</CardHeader>
										<CardContent>
											<div className='space-y-4'>
												<div>
													<label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
														Outcome
													</label>
													<select
														className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white'
														value={outcome}
														onChange={(e) => setOutcome(e.target.value as OutcomeValue)}>
														{RESOLUTION_OUTCOMES.map((o) => (
															<option
																key={o.value}
																value={o.value}>
																{o.label}
															</option>
														))}
													</select>
												</div>
												{RESOLUTION_OUTCOMES.find((o) => o.value === outcome)?.requiresRefund && (
													<div className='flex items-start gap-2 p-3 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700'>
														<AlertTriangle className='h-4 w-4 mt-0.5 text-amber-600 dark:text-amber-400 shrink-0' />
														<p className='text-sm text-amber-700 dark:text-amber-300'>
															A refund will be issued if a completed payment exists for the associated job.
														</p>
													</div>
												)}
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
													{outcome === "award_customer" ?
														"Award Customer & Issue Refund"
													: outcome === "award_provider" ?
														"Award Provider"
													:	"Update Dispute"}
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
