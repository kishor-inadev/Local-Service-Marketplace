'use client';

import { useEffect } from 'react';
import { CreditCard, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { ROUTES } from '@/config/constants';

export default function Error({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error(error);
	}, [error]);

	return (
		<div className='flex flex-col items-center justify-center min-h-[400px] gap-6 p-8 text-center'>
			<div className='p-4 rounded-full bg-red-100 dark:bg-red-900/30'>
				<CreditCard className='h-8 w-8 text-red-600 dark:text-red-400' />
			</div>
			<div>
				<h2 className='font-heading text-xl font-semibold text-gray-900 dark:text-white mb-2'>
					Payment page unavailable
				</h2>
				<p className='text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto'>
					We couldn&apos;t load the payment page. Your card has not been charged. Please try again.
				</p>
			</div>
			<div className='flex gap-3 flex-wrap justify-center'>
				<Button onClick={reset} variant='outline' size='sm'>
					<RefreshCw className='h-4 w-4 mr-2' /> Try again
				</Button>
				<Link href={ROUTES.DASHBOARD}>
					<Button variant='ghost' size='sm'>Go to Dashboard</Button>
				</Link>
			</div>
		</div>
	);
}
