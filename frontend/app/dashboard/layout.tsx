import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { VerificationBanner } from "@/components/shared/VerificationBanner";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
	title: {
		default: 'Dashboard',
		template: '%s - Dashboard | Local Service Marketplace',
	},
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className='flex min-h-screen bg-gray-50 dark:bg-gray-900'>
			<DashboardSidebar />
			<div className='flex-1 min-w-0 flex flex-col'>
				<VerificationBanner />
				<main className='flex-1'>{children}</main>
			</div>
		</div>
	);
}
