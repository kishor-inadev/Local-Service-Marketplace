'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from "@/config/constants";
import { Layout } from '@/components/layout/Layout';
import { PortfolioUpload } from '@/components/features/provider/PortfolioUpload';
import { PortfolioGallery } from '@/components/features/provider/PortfolioGallery';
import { ErrorState } from "@/components/ui/ErrorState";
import { apiClient } from '@/services/api-client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ImageIcon, Star, FileText } from 'lucide-react';
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";

export default function ProviderPortfolioPage() {
	const pathname = usePathname();
	const { user, isAuthenticated } = useAuth();

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
	];

	return (
		<ProtectedRoute requiredRoles={["provider"]}>
			<Layout>
				<div className='container-custom py-8'>
					<div className='mb-8'>
						<h1 className='text-3xl font-bold text-gray-900 dark:text-white'>Provider Dashboard</h1>
						<p className='mt-2 text-gray-600 dark:text-gray-400'>Manage your portfolio</p>
					</div>

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
											:	"border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
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
							title='Failed to load portfolio'
							message="We couldn't load your provider data. Please try again."
							retry={() => refetch()}
						/>
					:	<div className='space-y-8'>
							<PortfolioUpload
								providerId={provider?.id}
								onUploadSuccess={() => window.location.reload()}
							/>
							<PortfolioGallery providerId={provider?.id} />
						</div>
					}
				</div>
			</Layout>
		</ProtectedRoute>
	);
}
