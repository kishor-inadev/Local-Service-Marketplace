'use client';

import { useEffect } from 'react';
import { ErrorState } from './ErrorState';

interface RouteErrorProps {
	error: Error & { digest?: string };
	reset: () => void;
	title?: string;
	message?: string;
}

/**
 * Reusable fallback for Next.js route-level error.tsx files.
 * Usage:
 *   export default function Error(props) { return <RouteError {...props} message="Custom msg" />; }
 */
export function RouteError({
	error,
	reset,
	title = 'Something went wrong',
	message = 'An unexpected error occurred. Please try again.',
}: RouteErrorProps) {
	useEffect(() => {
		console.error(error);
	}, [error]);

	return (
		<ErrorState
			title={title}
			message={message}
			retry={reset}
			className='min-h-[400px]'
		/>
	);
}
