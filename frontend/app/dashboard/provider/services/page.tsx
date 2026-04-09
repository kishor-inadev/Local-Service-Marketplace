"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Layout } from "@/components/layout/Layout";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Loading } from "@/components/ui/Loading";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { getProviderServices, addProviderCategory, removeProviderCategory } from "@/services/user-service";
import { requestService } from "@/services/request-service";
import { apiClient } from "@/services/api-client";
import { Tag, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

export default function ProviderServicesPage() {
	const { user, isAuthenticated } = useAuth();
	const queryClient = useQueryClient();
	const [selectedCategoryId, setSelectedCategoryId] = useState("");

	// Get the provider record for this user
	const { data: providerData } = useQuery({
		queryKey: ["my-provider", user?.id],
		queryFn: async () => {
			const response = await apiClient.get(`/providers?user_id=${user?.id}`);
			const list = response.data?.data ?? response.data ?? [];
			return (Array.isArray(list) ? list[0] : null) ?? null;
		},
		enabled: isAuthenticated && user?.role === "provider",
	});

	const providerId: string | undefined = providerData?.id;

	// Current services the provider offers
	const { data: services = [], isLoading: servicesLoading } = useQuery({
		queryKey: ["provider-services", providerId],
		queryFn: () => getProviderServices(providerId!),
		enabled: !!providerId,
	});

	// All available categories
	const { data: allCategories = [], isLoading: categoriesLoading } = useQuery({
		queryKey: ["categories"],
		queryFn: () => requestService.getCategories(),
	});

	const usedCategoryIds = new Set(services.map((s) => s.category_id));
	const availableCategories = allCategories.filter((c: any) => !usedCategoryIds.has(c.id));

	const addMutation = useMutation({
		mutationFn: () => addProviderCategory(providerId!, selectedCategoryId),
		onSuccess: () => {
			toast.success("Service added");
			setSelectedCategoryId("");
			queryClient.invalidateQueries({ queryKey: ["provider-services", providerId] });
		},
		onError: () => toast.error("Failed to add service"),
	});

	const removeMutation = useMutation({
		mutationFn: (serviceId: string) => removeProviderCategory(providerId!, serviceId),
		onSuccess: () => {
			toast.success("Service removed");
			queryClient.invalidateQueries({ queryKey: ["provider-services", providerId] });
		},
		onError: () => toast.error("Failed to remove service"),
	});

	const getCategoryName = (categoryId: string) => {
		const cat = allCategories.find((c: any) => c.id === categoryId) as any;
		return cat?.name ?? categoryId;
	};

	const isLoading = servicesLoading || categoriesLoading;

	return (
		<ProtectedRoute requiredRoles={["provider"]}>
			<Layout>
				<div className='container-custom py-8'>
					<div className='mb-8'>
						<h1 className='text-3xl font-bold text-gray-900 dark:text-white'>My Services</h1>
						<p className='mt-2 text-gray-600 dark:text-gray-400'>
							Manage the service categories you offer to customers
						</p>
					</div>

					{isLoading ?
						<Loading />
					:	<div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
							{/* Current services */}
							<div className='lg:col-span-2'>
								<Card>
									<CardHeader>
										<div className='flex items-center gap-2'>
											<Tag className='h-5 w-5 text-primary-600' />
											<h2 className='text-lg font-semibold text-gray-900 dark:text-white'>
												Current Services ({services.length})
											</h2>
										</div>
									</CardHeader>
									<CardContent>
										{services.length === 0 ?
											<p className='text-gray-500 dark:text-gray-400 text-sm py-4 text-center'>
												No services added yet. Add your first service category below.
											</p>
										:	<ul className='space-y-3'>
												{services.map((service) => (
													<li
														key={service.id}
														className='flex items-center justify-between px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'>
														<span className='font-medium text-gray-900 dark:text-white'>
															{getCategoryName(service.category_id)}
														</span>
														<Button
															variant='ghost'
															size='sm'
															onClick={() => removeMutation.mutate(service.id)}
															disabled={removeMutation.isPending}
															className='text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20'>
															<Trash2 className='h-4 w-4' />
														</Button>
													</li>
												))}
											</ul>
										}
									</CardContent>
								</Card>
							</div>

							{/* Add service panel */}
							<div>
								<Card>
									<CardHeader>
										<div className='flex items-center gap-2'>
											<Plus className='h-5 w-5 text-primary-600' />
											<h2 className='text-lg font-semibold text-gray-900 dark:text-white'>Add Service</h2>
										</div>
									</CardHeader>
									<CardContent>
										{availableCategories.length === 0 ?
											<p className='text-gray-500 dark:text-gray-400 text-sm'>
												You have added all available service categories.
											</p>
										:	<div className='space-y-4'>
												<div>
													<label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
														Category
													</label>
													<select
														className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white'
														value={selectedCategoryId}
														onChange={(e) => setSelectedCategoryId(e.target.value)}>
														<option value=''>Select a category...</option>
														{availableCategories.map((cat: any) => (
															<option
																key={cat.id}
																value={cat.id}>
																{cat.name}
															</option>
														))}
													</select>
												</div>
												<Button
													onClick={() => addMutation.mutate()}
													disabled={!selectedCategoryId || addMutation.isPending || !providerId}
													isLoading={addMutation.isPending}
													className='w-full'>
													Add Service
												</Button>
											</div>
										}
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
