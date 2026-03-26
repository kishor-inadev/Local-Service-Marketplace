"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/config/constants";
import { Layout } from "@/components/layout/Layout";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Loading } from "@/components/ui/Loading";
import { paymentService, PricingPlan } from "@/services/payment-service";
import { formatCurrency } from "@/utils/helpers";
import { CheckCircle, CreditCard, ArrowLeft } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function CheckoutPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const planId = searchParams.get("plan");
	const { user, isAuthenticated, isLoading: authLoading } = useAuth();
	const [success, setSuccess] = useState(false);

	useEffect(() => {
		if (!authLoading && !isAuthenticated) {
			router.push(ROUTES.LOGIN + "?callbackUrl=/checkout" + (planId ? `?plan=${planId}` : ""));
		}
	}, [isAuthenticated, authLoading, router, planId]);

	const { data: plans, isLoading: plansLoading } = useQuery({
		queryKey: ["pricing-plans"],
		queryFn: () => paymentService.getActivePricingPlans(),
		enabled: isAuthenticated,
	});

	const selectedPlan: PricingPlan | undefined = plans?.find((p) => p.id === planId) ?? plans?.[0];

	const subscribeMutation = useMutation({
		mutationFn: () =>
			paymentService.createPayment({
				job_id: selectedPlan!.id, // subscription payments use plan id as reference
				user_id: user!.id,
				provider_id: user!.id,
				amount: selectedPlan!.price,
				currency: "USD",
				payment_method: "subscription",
			}),
		onSuccess: () => {
			setSuccess(true);
			toast.success("Subscription activated!");
			setTimeout(() => router.push(ROUTES.DASHBOARD), 3000);
		},
		onError: (err: any) => {
			const msg =
				err?.response?.data?.error?.message || err?.response?.data?.message || "Payment failed. Please try again.";
			toast.error(msg);
		},
	});

	if (authLoading || plansLoading) {
		return (
			<Layout>
				<div className='min-h-screen flex items-center justify-center'>
					<Loading />
				</div>
			</Layout>
		);
	}

	if (!isAuthenticated) return null;

	if (success) {
		return (
			<Layout>
				<div className='min-h-screen flex items-center justify-center px-4'>
					<div className='max-w-md w-full text-center'>
						<CheckCircle className='mx-auto h-20 w-20 text-green-500 mb-4' />
						<h1 className='text-3xl font-bold text-gray-900 dark:text-white mb-2'>Subscription Active!</h1>
						<p className='text-gray-600 dark:text-gray-400 mb-6'>
							Your plan has been activated. Redirecting to your dashboard…
						</p>
						<Link href={ROUTES.DASHBOARD}>
							<Button className='w-full'>Go to Dashboard</Button>
						</Link>
					</div>
				</div>
			</Layout>
		);
	}

	if (!selectedPlan) {
		return (
			<Layout>
				<div className='container-custom py-12 text-center'>
					<h2 className='text-2xl font-bold text-gray-900 dark:text-white mb-4'>Plan not found</h2>
					<Link href='/pricing'>
						<Button variant='outline'>
							<ArrowLeft className='w-4 h-4 mr-2' />
							View Pricing Plans
						</Button>
					</Link>
				</div>
			</Layout>
		);
	}

	const features: string[] =
		selectedPlan.features ?
			Object.entries(selectedPlan.features)
				.filter(([, v]) => Boolean(v))
				.map(([k]) => k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()))
		:	[];

	return (
		<Layout>
			<div className='bg-gray-50 dark:bg-gray-900 min-h-screen py-12'>
				<div className='max-w-2xl mx-auto px-4'>
					<div className='mb-6'>
						<Link
							href='/pricing'
							className='inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400'>
							<ArrowLeft className='w-4 h-4 mr-1' />
							Back to Pricing
						</Link>
					</div>

					<h1 className='text-3xl font-bold text-gray-900 dark:text-white mb-8'>Checkout</h1>

					<div className='grid gap-6'>
						{/* Plan Summary */}
						<Card>
							<CardHeader>
								<h2 className='text-lg font-semibold text-gray-900 dark:text-white'>Order Summary</h2>
							</CardHeader>
							<CardContent>
								<div className='flex items-center justify-between mb-4'>
									<div>
										<p className='font-semibold text-gray-900 dark:text-white text-lg'>{selectedPlan.name}</p>
										{selectedPlan.description && (
											<p className='text-sm text-gray-600 dark:text-gray-400 mt-1'>{selectedPlan.description}</p>
										)}
										<p className='text-sm text-gray-500 dark:text-gray-500 capitalize mt-1'>
											Billed {selectedPlan.billing_period}
										</p>
									</div>
									<div className='text-right'>
										<p className='text-2xl font-bold text-primary-600 dark:text-primary-400'>
											{formatCurrency(selectedPlan.price)}
										</p>
										<p className='text-sm text-gray-500 dark:text-gray-500'>
											/{selectedPlan.billing_period === "yearly" ? "yr" : "mo"}
										</p>
									</div>
								</div>

								{features.length > 0 && (
									<ul className='space-y-2 border-t border-gray-200 dark:border-gray-700 pt-4'>
										{features.map((feat) => (
											<li
												key={feat}
												className='flex items-center text-sm text-gray-700 dark:text-gray-300'>
												<CheckCircle className='w-4 h-4 text-green-500 mr-2 flex-shrink-0' />
												{feat}
											</li>
										))}
									</ul>
								)}
							</CardContent>
						</Card>

						{/* Payment */}
						<Card>
							<CardHeader>
								<h2 className='text-lg font-semibold text-gray-900 dark:text-white flex items-center'>
									<CreditCard className='w-5 h-5 mr-2' />
									Payment
								</h2>
							</CardHeader>
							<CardContent>
								<div className='bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6 text-sm text-blue-800 dark:text-blue-300'>
									Your subscription will be billed {selectedPlan.billing_period}. You can cancel anytime from your{" "}
									<Link
										href={ROUTES.DASHBOARD_SETTINGS + "/subscription"}
										className='underline font-medium'>
										subscription settings
									</Link>
									.
								</div>

								<div className='flex items-center justify-between mb-4 text-gray-700 dark:text-gray-300'>
									<span>Total due today</span>
									<span className='font-bold text-lg'>{formatCurrency(selectedPlan.price)}</span>
								</div>

								<Button
									onClick={() => subscribeMutation.mutate()}
									isLoading={subscribeMutation.isPending}
									className='w-full'
									size='lg'>
									{subscribeMutation.isPending ? "Processing…" : `Subscribe — ${formatCurrency(selectedPlan.price)}`}
								</Button>
								<p className='text-xs text-center text-gray-500 dark:text-gray-400 mt-3'>
									Secure checkout. By subscribing, you agree to our Terms of Service.
								</p>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</Layout>
	);
}
