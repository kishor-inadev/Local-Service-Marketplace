"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ErrorState } from "@/components/ui/ErrorState";
import { ROUTES } from "@/config/constants";
import { adminService, AdminCreateUserPayload } from "@/services/admin-service";
import toast from "react-hot-toast";

export default function AdminCreateUserPage() {
	const router = useRouter();
	const queryClient = useQueryClient();
	const [form, setForm] = useState<AdminCreateUserPayload>({
		email: "",
		password: "",
		name: "",
		phone: "",
		role: "customer",
		timezone: "UTC",
		language: "en",
		emailVerified: false,
		status: "active",
	});
	const [errorMessage, setErrorMessage] = useState<string>("");

	const isValid = useMemo(() => {
		return form.email.trim().length > 3 && form.password.length >= 8 && form.name?.trim().length;
	}, [form]);

	const createUserMutation = useMutation({
		mutationFn: (payload: AdminCreateUserPayload) => adminService.createUser(payload),
		onSuccess: () => {
			toast.success("User created successfully");
			queryClient.invalidateQueries({ queryKey: ["admin-users"] });
			router.push(ROUTES.DASHBOARD_ADMIN_USERS);
		},
		onError: (error: any) => {
			const message = error?.response?.data?.message || error?.message || "Failed to create user";
			setErrorMessage(String(message));
		},
	});

	const updateField = (field: keyof AdminCreateUserPayload, value: string) => {
		setErrorMessage("");
		setForm((prev) => ({ ...prev, [field]: value }));
	};

	const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!isValid) {
			setErrorMessage("Please complete all required fields.");
			return;
		}
		createUserMutation.mutate(form);
	};

	return (
		<ProtectedRoute requiredRoles={["admin"]}>
			<Layout>
				<div className='container-custom py-10'>
					<div className='mb-8 flex items-start justify-between gap-4'>
						<div>
							<h1 className='text-3xl font-bold text-gray-900 dark:text-white'>Create User</h1>
							<p className='mt-2 text-gray-600 dark:text-gray-400'>Add a new account to the marketplace platform.</p>
						</div>
						<Button
							variant='outline'
							onClick={() => router.push(ROUTES.DASHBOARD_ADMIN_USERS)}>
							Back to Users
						</Button>
					</div>

					<Card>
						<CardHeader>
							<h2 className='text-lg font-semibold text-gray-900 dark:text-white'>Account Information</h2>
						</CardHeader>
						<CardContent>
							{errorMessage && (
								<div className='mb-4'>
									<ErrorState
										title='Unable to create user'
										message={errorMessage}
									/>
								</div>
							)}

							<form
								className='grid grid-cols-1 gap-4 md:grid-cols-2'
								onSubmit={onSubmit}>
								<div className='md:col-span-2'>
									<Input
										label='Full Name *'
										value={form.name || ""}
										onChange={(e) => updateField("name", e.target.value)}
									/>
								</div>

								<Input
									label='Email *'
									type='email'
									value={form.email}
									onChange={(e) => updateField("email", e.target.value)}
								/>

								<Input
									label='Password *'
									type='password'
									value={form.password}
									onChange={(e) => updateField("password", e.target.value)}
								/>

								<Input
									label='Phone'
									value={form.phone || ""}
									onChange={(e) => updateField("phone", e.target.value)}
								/>

								<div>
									<label className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'>Role *</label>
									<select
										value={form.role}
										onChange={(e) => updateField("role", e.target.value as AdminCreateUserPayload["role"])}
										className='h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200'>
										<option value='customer'>Customer</option>
										<option value='provider'>Provider</option>
										<option value='admin'>Admin</option>
									</select>
								</div>

								<div className='md:col-span-2 mt-2 flex justify-end gap-3'>
									<Button
										variant='outline'
										type='button'
										onClick={() => router.push(ROUTES.DASHBOARD_ADMIN_USERS)}>
										Cancel
									</Button>
									<Button
										type='submit'
										disabled={!isValid}
										isLoading={createUserMutation.isPending}>
										Create User
									</Button>
								</div>
							</form>
						</CardContent>
					</Card>
				</div>
			</Layout>
		</ProtectedRoute>
	);
}
