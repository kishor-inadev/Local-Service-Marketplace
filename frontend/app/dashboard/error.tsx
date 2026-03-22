"use client";

import { useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/Button";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
	useEffect(() => {
		console.error("Dashboard Error:", error);
	}, [error]);

	return (
		<Layout>
			<div className='min-h-[60vh] flex items-center justify-center px-4'>
				<div className='max-w-md w-full text-center'>
					<AlertTriangle className='h-14 w-14 text-red-500 mx-auto mb-4' />
					<h1 className='text-2xl font-bold text-gray-900 dark:text-white mb-2'>Something went wrong</h1>
					<p className='text-gray-600 dark:text-gray-400 mb-6'>
						We encountered an error loading this page. Please try again.
					</p>
					{error.digest && <p className='text-sm text-gray-500 mb-4'>Error ID: {error.digest}</p>}
					<div className='flex gap-3 justify-center'>
						<Button
							onClick={reset}
							className='gap-2'>
							<RefreshCw className='h-4 w-4' />
							Try Again
						</Button>
						<Button
							variant='outline'
							onClick={() => (window.location.href = "/dashboard")}
							className='gap-2'>
							<Home className='h-4 w-4' />
							Dashboard
						</Button>
					</div>
				</div>
			</div>
		</Layout>
	);
}
