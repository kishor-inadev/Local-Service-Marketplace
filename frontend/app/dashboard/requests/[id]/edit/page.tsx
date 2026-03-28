"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/config/constants";
import { Layout } from "@/components/layout/Layout";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Loading } from "@/components/ui/Loading";
import { ErrorState } from "@/components/ui/ErrorState";
import { requestService, UpdateRequestData } from "@/services/request-service";
import { ArrowLeft, Save } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";

export default function EditRequestPage() {
	const params = useParams();
	const router = useRouter();
	const queryClient = useQueryClient();
	const { user, isAuthenticated, isLoading: authLoading } = useAuth();
	const requestId = params.id as string;

	useEffect(() => {
		if (!authLoading && !isAuthenticated) {
			router.push(ROUTES.LOGIN);
		}
	}, [isAuthenticated, authLoading, router]);

	const {
		data: request,
		isLoading,
		error,
		refetch,
	} = useQuery({
		queryKey: ["request", requestId],
		queryFn: () => requestService.getRequestById(requestId),
		enabled: isAuthenticated && !!requestId,
	});

	const {
		register,
		handleSubmit,
		formState: { errors },
		reset,
	} = useForm<UpdateRequestData>({ values: { description: request?.description ?? "", budget: request?.budget ?? 0 } });

	const updateMutation = useMutation({
		mutationFn: (data: UpdateRequestData) => requestService.updateRequest(requestId, data),
		onSuccess: () => {
			toast.success("Request updated successfully!");
			queryClient.invalidateQueries({ queryKey: ["request", requestId] });
			router.push(ROUTES.DASHBOARD_REQUEST_DETAIL(requestId));
		},
		onError: () => toast.error("Failed to update request"),
	});

	if (authLoading || isLoading) {
		return (
			<Layout>
				<Loading />
			</Layout>
		);
	}

	if (!isAuthenticated) return null;

	if (error || !request) {
		return (
			<Layout>
				<div className='container-custom py-8'>
					<ErrorState
						title='Request not found'
						message="We couldn't find this request."
						retry={() => refetch()}
					/>
				</div>
			</Layout>
		);
	}

	// Only the owner can edit
	if (user?.id !== request.user_id || request.status !== "open") {
		router.push(ROUTES.DASHBOARD_REQUEST_DETAIL(requestId));
		return null;
	}

	return (
		<ProtectedRoute requiredRoles={["customer"]}>
			<Layout>
				<div className='container-custom py-8'>
					<div className='max-w-2xl mx-auto'>
						<Link
							href={ROUTES.DASHBOARD_REQUEST_DETAIL(requestId)}
							className='inline-flex items-center text-primary-600 hover:text-primary-700 mb-6'>
							<ArrowLeft className='h-4 w-4 mr-2' />
							Back to Request
						</Link>

						<Card>
							<CardHeader>
								<h1 className='text-2xl font-bold text-gray-900 dark:text-white'>Edit Request</h1>
							</CardHeader>
							<CardContent>
								<form
									onSubmit={handleSubmit((data) => updateMutation.mutate(data))}
									className='space-y-6'>
									<div>
										<label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>Description</label>
										<textarea
											rows={5}
											className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white'
											{...register("description", {
												required: "Description is required",
												minLength: { value: 10, message: "At least 10 characters" },
											})}
										/>
										{errors.description && <p className='mt-1 text-sm text-red-600'>{errors.description.message}</p>}
									</div>

									<div>
										<label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>Budget ($)</label>
										<Input
											type='number'
											min={0}
											step={0.01}
											{...register("budget", {
												required: "Budget is required",
												min: { value: 1, message: "Budget must be at least $1" },
												valueAsNumber: true,
											})}
										/>
										{errors.budget && <p className='mt-1 text-sm text-red-600'>{errors.budget.message}</p>}
									</div>

									<div className='flex gap-3 pt-2'>
										<Button
											type='submit'
											isLoading={updateMutation.isPending}
											disabled={updateMutation.isPending}>
											<Save className='h-4 w-4 mr-2' />
											Save Changes
										</Button>
										<Button
											type='button'
											variant='outline'
											onClick={() => router.push(ROUTES.DASHBOARD_REQUEST_DETAIL(requestId))}>
											Cancel
										</Button>
									</div>
								</form>
							</CardContent>
						</Card>
					</div>
				</div>
			</Layout>
		</ProtectedRoute>
	);
}
