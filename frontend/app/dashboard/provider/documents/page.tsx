'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { Permission } from '@/utils/permissions';
import { ROUTES } from "@/config/constants";
import { Layout } from '@/components/layout/Layout';
import { DocumentUpload } from '@/components/features/provider/DocumentUpload';
import { DocumentList } from '@/components/features/provider/DocumentList';
import { ErrorState } from "@/components/ui/ErrorState";
import { apiClient } from '@/services/api-client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ImageIcon, Star, FileText, CheckCircle, XCircle } from 'lucide-react';
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";

export default function ProviderDocumentsPage() {
	const pathname = usePathname();
	const { user, isAuthenticated } = useAuth();
	const { can } = usePermissions();
	const queryClient = useQueryClient();

	const [gstin, setGstin] = useState('');
	const [pan, setPan] = useState('');
	const [taxSaved, setTaxSaved] = useState(false);

	const {
		data: provider,
		error,
		refetch,
	} = useQuery({
		queryKey: ["provider-profile", user?.id],
		queryFn: async () => {
			const response = await apiClient.get(`/providers?user_id=${user?.id}`);
			if (response.data?.data && response.data.data.length > 0) {
				const p = response.data.data[0];
				setGstin(p.gstin ?? '');
				setPan(p.pan ?? '');
				return p;
			}
			return null;
		},
		enabled: isAuthenticated && can(Permission.PROVIDER_PROFILE_VIEW),
	});

	const saveTaxMutation = useMutation({
		mutationFn: async () => {
			await apiClient.patch(`/providers/${provider?.id}`, {
				gstin: gstin.toUpperCase() || undefined,
				pan: pan.toUpperCase() || undefined,
			});
		},
		onSuccess: () => {
			setTaxSaved(true);
			queryClient.invalidateQueries({ queryKey: ['provider-profile', user?.id] });
			setTimeout(() => setTaxSaved(false), 3000);
		},
	});

	const gstinValid = !gstin || /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gstin.toUpperCase());
	const panValid = !pan || /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan.toUpperCase());

	const tabs = [
		{ href: ROUTES.DASHBOARD_PROVIDER_OVERVIEW, label: "Overview", icon: LayoutDashboard },
		{ href: ROUTES.DASHBOARD_PROVIDER_PORTFOLIO, label: "Portfolio", icon: ImageIcon },
		{ href: ROUTES.DASHBOARD_PROVIDER_REVIEWS, label: "Reviews", icon: Star },
		{ href: ROUTES.DASHBOARD_PROVIDER_DOCUMENTS, label: "Documents", icon: FileText },
	];

	return (
		<ProtectedRoute requiredPermissions={[Permission.PROVIDER_PROFILE_VIEW]}>
			<Layout>
				<div className='container-custom py-8'>
					<div className='mb-8'>
						<h1 className='text-3xl font-bold text-gray-900 dark:text-white'>Provider Dashboard</h1>
						<p className='mt-2 text-gray-600 dark:text-gray-400'>Manage your documents</p>
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
							title='Failed to load documents'
							message="We couldn't load your provider data. Please try again."
							retry={() => refetch()}
						/>
					:	<div className='space-y-8'>
							<div className='grid lg:grid-cols-2 gap-8'>
								<DocumentUpload
									providerId={provider?.id}
									onUploadSuccess={() => window.location.reload()}
								/>
								<DocumentList providerId={provider?.id} />
							</div>

							{/* India Tax & Identity Section */}
							<div className='bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6'>
								<h2 className='text-lg font-semibold text-gray-900 dark:text-white mb-1'>Tax &amp; Identity (India)</h2>
								<p className='text-sm text-gray-500 dark:text-gray-400 mb-6'>
									Required for GST invoicing and TDS compliance. GSTIN and PAN are stored securely.
								</p>

								<div className='grid sm:grid-cols-2 gap-6'>
									{/* GSTIN */}
									<div>
										<label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
											GSTIN <span className='text-gray-400 font-normal'>(optional)</span>
										</label>
										<input
											type='text'
											value={gstin}
											onChange={(e) => setGstin(e.target.value.toUpperCase())}
											maxLength={15}
											placeholder='22AAAAA0000A1Z5'
											className={`w-full rounded-lg border px-3 py-2 text-sm font-mono bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 ${
												!gstinValid ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'
											}`}
										/>
										{!gstinValid && (
											<p className='mt-1 text-xs text-red-500'>Invalid GSTIN format (e.g. 22AAAAA0000A1Z5)</p>
										)}
									</div>

									{/* PAN */}
									<div>
										<label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
											PAN <span className='text-gray-400 font-normal'>(optional)</span>
										</label>
										<input
											type='text'
											value={pan}
											onChange={(e) => setPan(e.target.value.toUpperCase())}
											maxLength={10}
											placeholder='ABCDE1234F'
											className={`w-full rounded-lg border px-3 py-2 text-sm font-mono bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 ${
												!panValid ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'
											}`}
										/>
										{!panValid && (
											<p className='mt-1 text-xs text-red-500'>Invalid PAN format (e.g. ABCDE1234F)</p>
										)}
									</div>
								</div>

								{/* Aadhaar verification status */}
								<div className='mt-5 flex items-center gap-3'>
									<span className='text-sm text-gray-600 dark:text-gray-400'>Aadhaar verification:</span>
									{provider?.aadhar_verified ? (
										<span className='inline-flex items-center gap-1 text-sm font-medium text-green-600'>
											<CheckCircle className='h-4 w-4' /> Verified
										</span>
									) : (
										<span className='inline-flex items-center gap-1 text-sm font-medium text-gray-400'>
											<XCircle className='h-4 w-4' /> Not verified
										</span>
									)}
								</div>

								<div className='mt-6 flex items-center gap-4'>
									<button
										onClick={() => saveTaxMutation.mutate()}
										disabled={saveTaxMutation.isPending || !gstinValid || !panValid}
										className='inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'>
										{saveTaxMutation.isPending ? 'Saving…' : 'Save Tax Details'}
									</button>
									{taxSaved && (
										<span className='text-sm text-green-600 dark:text-green-400 flex items-center gap-1'>
											<CheckCircle className='h-4 w-4' /> Saved successfully
										</span>
									)}
									{saveTaxMutation.isError && (
										<span className='text-sm text-red-500'>Failed to save. Please try again.</span>
									)}
								</div>
							</div>
						</div>
					}
				</div>
			</Layout>
		</ProtectedRoute>
	);
}
