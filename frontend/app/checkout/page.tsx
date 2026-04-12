"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/config/constants";
import { Layout } from "@/components/layout/Layout";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Loading } from "@/components/ui/Loading";
import { paymentService, PricingPlan } from "@/services/payment-service";
import { getProviderProfileByUserId } from "@/services/user-service";
import { jobService } from "@/services/job-service";
import { formatCurrency } from "@/utils/helpers";
import { AlertCircle, CheckCircle, CreditCard, ArrowLeft, Briefcase } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

// â”€â”€â”€ Job Payment Flow â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function JobCheckout({ jobId }: { jobId: string }) {
	const router = useRouter();
	useAuth();

	const { data: job, isLoading } = useQuery({
		queryKey: ["job", jobId],
		queryFn: () => jobService.getJobById(jobId),
		enabled: !!jobId,
	});

	const payMutation = useMutation({
		mutationFn: async () => {
			if (!job) throw new Error("Job not found");
			return paymentService.createPayment({
				job_id: job.id,
				provider_id: job.provider_id || (job as any)?.provider?.id || "",
				amount: job.actual_amount || 0,
				currency: "USD",
			});
		},
		onSuccess: () => {
			toast.success("Payment processed successfully!");
			router.push(ROUTES.DASHBOARD_JOB_DETAIL(jobId));
		},
		onError: (err: any) => {
			const msg = err?.response?.data?.message || err?.message || "Payment failed";
			toast.error(msg);
		},
	});

	if (isLoading) {
		return (
			<Layout>
				<div className="min-h-screen flex items-center justify-center"><Loading /></div>
			</Layout>
		);
	}

	if (!job) {
		return (
			<Layout>
				<div className="container-custom py-12 text-center">
					<h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Job not found</h2>
					<Link href={ROUTES.DASHBOARD_JOBS}><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Back to Jobs</Button></Link>
				</div>
			</Layout>
		);
	}

	const amount = job.actual_amount || 0;

	return (
		<Layout>
			<div className="bg-gray-50 dark:bg-gray-900 min-h-screen py-12">
				<div className="max-w-2xl mx-auto px-4">
					<div className="mb-6">
						<Link href={ROUTES.DASHBOARD_JOB_DETAIL(jobId)} className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600">
							<ArrowLeft className="w-4 h-4 mr-1" />Back to Job
						</Link>
					</div>
					<h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Pay for Job</h1>
					<div className="grid gap-6">
						{/* Job Summary */}
						<Card>
							<CardHeader>
								<h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
									<Briefcase className="h-5 w-5 text-primary-600" />Order Summary
								</h2>
							</CardHeader>
							<CardContent>
								<div className="flex items-center justify-between mb-4">
									<div>
										<p className="font-semibold text-gray-900 dark:text-white text-lg">
											Job #{(job as any).display_id || job.id.slice(0, 8).toUpperCase()}
										</p>
										<p className="text-sm text-gray-600 dark:text-gray-400 mt-1 capitalize">Status: {job.status}</p>
									</div>
									<div className="text-right">
										<p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{formatCurrency(amount)}</p>
										<p className="text-sm text-gray-500">Total amount</p>
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Payment */}
						<Card>
							<CardHeader>
								<h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
									<CreditCard className="w-5 h-5 mr-2" />Payment
								</h2>
							</CardHeader>
							<CardContent>
								<div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6 text-sm text-blue-900 dark:text-blue-200">
									<div className="flex items-start gap-3">
										<AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
										<p>This payment will be processed and funds released to the provider. This action cannot be reversed.</p>
									</div>
								</div>
								<div className="flex items-center justify-between mb-6 text-gray-700 dark:text-gray-300">
									<span className="font-medium">Total due</span>
									<span className="font-bold text-xl">{formatCurrency(amount)}</span>
								</div>
								<Button
									onClick={() => payMutation.mutate()}
									isLoading={payMutation.isPending}
									disabled={amount === 0}
									className="w-full"
									size="lg">
									{payMutation.isPending ? "Processing Paymentâ€¦" : `Pay ${formatCurrency(amount)}`}
								</Button>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</Layout>
	);
}

// â”€â”€â”€ Subscription Checkout Flow â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function SubscriptionCheckout({ planId }: { planId: string | null }) {
	const router = useRouter();
	const { user, isAuthenticated, isLoading: authLoading } = useAuth();

	useEffect(() => {
		if (!authLoading && !isAuthenticated) {
			router.push(ROUTES.LOGIN + "?callbackUrl=/checkout" + (planId ? `?plan=${planId}` : ""));
		}
	}, [isAuthenticated, authLoading, router, planId]);

	const { data: provider, isLoading: providerLoading } = useQuery({
		queryKey: ["provider-profile-by-user", user?.id],
		queryFn: () => getProviderProfileByUserId(user!.id),
		enabled: isAuthenticated && user?.role === "provider" && !!user?.id,
	});

	const { data: plans, isLoading: plansLoading } = useQuery({
		queryKey: ["pricing-plans"],
		queryFn: () => paymentService.getActivePricingPlans(),
		enabled: isAuthenticated,
	});

	const selectedPlan: PricingPlan | undefined = plans?.find((p) => p.id === planId) ?? plans?.[0];

	const subscribeMutation = useMutation({
		mutationFn: async () => {
			if (!selectedPlan) throw new Error("Plan not found");
			if (!provider?.id) throw new Error("Provider profile not found");
			const subscription = await paymentService.createSubscription({ provider_id: provider.id, plan_id: selectedPlan.id });
			const subscriptionId = (subscription as any)?.data?.id ?? (subscription as any)?.id;
			if (!subscriptionId) throw new Error("Subscription created but ID not returned");
			await paymentService.activateSubscription(subscriptionId);
			return subscription;
		},
		onSuccess: () => {
			toast.success("Subscription activated successfully!");
			router.push(`${ROUTES.DASHBOARD_SETTINGS}/subscription`);
		},
		onError: (error: any) => {
			const message = error?.response?.data?.error?.message || error?.response?.data?.message || error?.message || "Failed to activate subscription.";
			toast.error(message);
		},
	});

	if (authLoading || plansLoading || providerLoading) {
		return (
			<Layout>
				<div className="min-h-screen flex items-center justify-center"><Loading /></div>
			</Layout>
		);
	}

	if (!isAuthenticated) return null;

	if (!selectedPlan) {
		return (
			<Layout>
				<div className="container-custom py-12 text-center">
					<h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Plan not found</h2>
					<Link href="/pricing"><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />View Pricing Plans</Button></Link>
				</div>
			</Layout>
		);
	}

	const features: string[] =
		selectedPlan.features ?
			Object.entries(selectedPlan.features).filter(([, v]) => Boolean(v)).map(([k]) => k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()))
		: [];

	const missingProviderProfile = !provider?.id;

	return (
		<Layout>
			<div className="bg-gray-50 dark:bg-gray-900 min-h-screen py-12">
				<div className="max-w-2xl mx-auto px-4">
					<div className="mb-6">
						<Link href="/pricing" className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400">
							<ArrowLeft className="w-4 h-4 mr-1" />Back to Pricing
						</Link>
					</div>
					<h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Checkout</h1>
					<div className="grid gap-6">
						<Card>
							<CardHeader><h2 className="text-lg font-semibold text-gray-900 dark:text-white">Order Summary</h2></CardHeader>
							<CardContent>
								<div className="flex items-center justify-between mb-4">
									<div>
										<p className="font-semibold text-gray-900 dark:text-white text-lg">{selectedPlan.name}</p>
										{selectedPlan.description && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{selectedPlan.description}</p>}
										<p className="text-sm text-gray-500 dark:text-gray-500 capitalize mt-1">Billed {selectedPlan.billing_period}</p>
									</div>
									<div className="text-right">
										<p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{formatCurrency(selectedPlan.price)}</p>
										<p className="text-sm text-gray-500 dark:text-gray-500">/{selectedPlan.billing_period === "yearly" ? "yr" : "mo"}</p>
									</div>
								</div>
								{features.length > 0 && (
									<ul className="space-y-2 border-t border-gray-200 dark:border-gray-700 pt-4">
										{features.map((feat) => (
											<li key={feat} className="flex items-center text-sm text-gray-700 dark:text-gray-300">
												<CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />{feat}
											</li>
										))}
									</ul>
								)}
							</CardContent>
						</Card>
						<Card>
							<CardHeader>
								<h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
									<CreditCard className="w-5 h-5 mr-2" />Activate Plan
								</h2>
							</CardHeader>
							<CardContent>
								<div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6 text-sm text-blue-900 dark:text-blue-200">
									<div className="flex items-start gap-3">
										<AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
										<div>
											<p className="font-medium mb-1">Instant activation in test/development mode.</p>
											<p>Your subscription will be active immediately. Manage upgrades and cancellation from subscription settings.</p>
											{missingProviderProfile && <p className="mt-2">A provider profile is required before you can activate a subscription plan.</p>}
										</div>
									</div>
								</div>
								<div className="flex items-center justify-between mb-4 text-gray-700 dark:text-gray-300">
									<span>Total due today</span>
									<span className="font-bold text-lg">{formatCurrency(selectedPlan.price)}</span>
								</div>
								<Button onClick={() => subscribeMutation.mutate()} isLoading={subscribeMutation.isPending} disabled={missingProviderProfile} className="w-full" size="lg">
									{subscribeMutation.isPending ? "Activating Subscriptionâ€¦" : `Subscribe Now â€” ${formatCurrency(selectedPlan.price)}`}
								</Button>
								<p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-3">
									Manage your current plan and subscription history from{" "}
									<Link href={ROUTES.DASHBOARD_SETTINGS + "/subscription"} className="underline font-medium">subscription settings</Link>.
								</p>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</Layout>
	);
}

// â”€â”€â”€ Router â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function CheckoutContent() {
	const searchParams = useSearchParams();
	const jobId = searchParams.get("jobId");
	const planId = searchParams.get("plan");

	if (jobId) return <JobCheckout jobId={jobId} />;
	return <SubscriptionCheckout planId={planId} />;
}

export default function CheckoutPage() {
	return (
		<Suspense fallback={<Layout><div className="min-h-screen flex items-center justify-center"><Loading /></div></Layout>}>
			<CheckoutContent />
		</Suspense>
	);
}


