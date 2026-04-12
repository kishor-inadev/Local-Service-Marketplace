'use client';


import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from "@/config/constants";
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/Card';
import { apiClient } from '@/services/api-client';
import { ErrorState } from "@/components/ui/ErrorState";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ImageIcon, Star, FileText, Calendar, Briefcase, Tag } from "lucide-react";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";

export default function ProviderOverviewPage() {
	const pathname = usePathname();
	const { user, isAuthenticated } = useAuth();

	// Fetch provider profile
	const {
		data: provider,
		error,
		refetch,
	} = useQuery({
		queryKey: ["provider-profile", user?.id],
		queryFn: async () => {
			const response = await apiClient.get(`/providers?user_id=${user?.id}`);
			if (response.data?.data && response.data.data.length > 0) {
				return response.data.data[0];
			}
			return null;
		},
		enabled: isAuthenticated && user?.role === "provider",
	});

	const tabs = [
		{ href: ROUTES.DASHBOARD_PROVIDER_OVERVIEW, label: "Overview", icon: LayoutDashboard },
		{ href: ROUTES.DASHBOARD_PROVIDER_PORTFOLIO, label: "Portfolio", icon: ImageIcon },
		{ href: ROUTES.DASHBOARD_PROVIDER_REVIEWS, label: "Reviews", icon: Star },
		{ href: ROUTES.DASHBOARD_PROVIDER_DOCUMENTS, label: "Documents", icon: FileText },
		{ href: ROUTES.DASHBOARD_PROVIDER_SERVICES, label: "Services", icon: Tag },
		{ href: ROUTES.DASHBOARD_AVAILABILITY, label: "Availability", icon: Calendar },
		{ href: ROUTES.DASHBOARD_BROWSE_REQUESTS, label: "Browse Jobs", icon: Briefcase },
	];

	return (
		<ProtectedRoute requiredRoles={["provider"]}>
			<Layout>
				<div className='container-custom py-8'>
					{/* Header */}
					<div className='mb-8'>
						<h1 className='text-3xl font-bold text-gray-900 dark:text-white'>Provider Dashboard</h1>
						<p className='mt-2 text-gray-600 dark:text-gray-400'>
							Manage your provider profile, portfolio, and business
						</p>
					</div>

					{/* Tabs Navigation */}
					<div className='border-b border-gray-200 dark:border-gray-700 mb-8'>
						<nav className='-mb-px flex space-x-8 overflow-x-auto'>
							{tabs.map((tab) => {
								const Icon = tab.icon;
								const isActive = pathname === tab.href;

								return (
									<Link
										key={tab.href}
										href={tab.href}
										className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
											isActive ?
												"border-primary-500 text-primary-600 dark:text-primary-400"
											:	"border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
										}`}>
										<Icon className='h-5 w-5' />
										{tab.label}
									</Link>
								);
							})}
						</nav>
					</div>

					{error ?
						<ErrorState
							title='Failed to load provider profile'
							message="We couldn't load your provider data. Please try again."
							retry={() => refetch()}
						/>
					:	<>
							{/* Content */}
							<div className='space-y-8'>
								<div>
									<h2 className='text-xl font-semibold text-gray-900 dark:text-white mb-4'>Quick Stats</h2>
									<div className='grid md:grid-cols-3 gap-6'>
										<Card>
											<CardContent className='pt-6'>
												<h3 className='font-medium text-gray-900 dark:text-white mb-2'>Business Name</h3>
												<p className='text-2xl font-bold text-primary-600 dark:text-primary-400'>
													{provider?.business_name || "Not set"}
												</p>
											</CardContent>
										</Card>
										<Card>
											<CardContent className='pt-6'>
												<h3 className='font-medium text-gray-900 dark:text-white mb-2'>Rating</h3>
												<p className='text-2xl font-bold text-primary-600 dark:text-primary-400'>
													{provider?.rating ? `${provider.rating.toFixed(1)} ⭐` : "No reviews yet"}
												</p>
											</CardContent>
										</Card>
										<Card>
											<CardContent className='pt-6'>
												<h3 className='font-medium text-gray-900 dark:text-white mb-2'>Status</h3>
												<p className='text-2xl font-bold text-green-600 dark:text-green-400'>Active</p>
											</CardContent>
										</Card>
									</div>
								</div>

								{/* Quick Actions */}
								<div>
									<h2 className='text-xl font-semibold text-gray-900 dark:text-white mb-4'>Quick Actions</h2>
									<div className='grid md:grid-cols-2 gap-4'>
										<Link href={ROUTES.DASHBOARD_BROWSE_REQUESTS}>
											<Card className='hover:shadow-lg transition-shadow cursor-pointer'>
												<CardContent className='pt-6 flex items-center gap-4'>
													<Briefcase className='h-8 w-8 text-primary-600' />
													<div>
														<h3 className='font-semibold text-gray-900 dark:text-white'>Browse Requests</h3>
														<p className='text-sm text-gray-600 dark:text-gray-400'>Find new job opportunities</p>
													</div>
												</CardContent>
											</Card>
										</Link>
										<Link href={ROUTES.DASHBOARD_MY_PROPOSALS}>
											<Card className='hover:shadow-lg transition-shadow cursor-pointer'>
												<CardContent className='pt-6 flex items-center gap-4'>
													<FileText className='h-8 w-8 text-primary-600' />
													<div>
														<h3 className='font-semibold text-gray-900 dark:text-white'>My Proposals</h3>
														<p className='text-sm text-gray-600 dark:text-gray-400'>View submitted proposals</p>
													</div>
												</CardContent>
											</Card>
										</Link>
									</div>
								</div>
							</div>
						</>
					}
				</div>
			</Layout>
		</ProtectedRoute>
	);
}
