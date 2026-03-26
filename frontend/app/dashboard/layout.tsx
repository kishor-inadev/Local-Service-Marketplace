import { DashboardSidebar } from "@/components/layout/DashboardSidebar";

export const dynamic = "force-dynamic";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className='flex min-h-screen bg-gray-50 dark:bg-gray-900'>
			<DashboardSidebar />
			<main className='flex-1 min-w-0'>{children}</main>
		</div>
	);
}
