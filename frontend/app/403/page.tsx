import Link from "next/link";
import { ShieldX, Home, ArrowLeft } from "lucide-react";

interface Props {
	searchParams: Promise<{ callbackUrl?: string }>;
}

export const metadata = { title: "403 – Access Forbidden" };

export default async function ForbiddenPage({ searchParams }: Props) {
	const { callbackUrl } = await searchParams;

	return (
		<div className='min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4'>
			<div className='max-w-md w-full text-center'>
				<ShieldX className='h-24 w-24 text-red-500 mx-auto mb-6' />
				<h1 className='text-6xl font-bold text-gray-900 dark:text-white mb-2'>403</h1>
				<h2 className='text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4'>Access Forbidden</h2>
				<p className='text-gray-600 dark:text-gray-400 mb-8'>
					You don&apos;t have permission to access this page. If you believe this is a mistake, please contact support.
				</p>

				{callbackUrl && (
					<p className='text-sm text-gray-500 font-mono bg-gray-100 dark:bg-gray-800 rounded px-3 py-2 mb-8 break-all'>
						{callbackUrl}
					</p>
				)}

				<div className='flex flex-col sm:flex-row gap-3 justify-center'>
					<Link
						href='/dashboard'
						className='inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-md transition-colors'>
						<Home className='h-4 w-4' />
						Go to Dashboard
					</Link>
					<Link
						href='/'
						className='inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors'>
						<ArrowLeft className='h-4 w-4' />
						Back to Home
					</Link>
				</div>
			</div>
		</div>
	);
}
