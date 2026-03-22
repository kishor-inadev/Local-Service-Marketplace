"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { AlertTriangle } from "lucide-react";

export default function AuthError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
	useEffect(() => {
		console.error("Auth Error:", error);
	}, [error]);

	return (
		<div className='min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4'>
			<div className='max-w-md w-full text-center'>
				<AlertTriangle className='h-14 w-14 text-red-500 mx-auto mb-4' />
				<h1 className='text-2xl font-bold text-gray-900 dark:text-white mb-2'>Authentication Error</h1>
				<p className='text-gray-600 dark:text-gray-400 mb-6'>
					Something went wrong during authentication. Please try again.
				</p>
				<div className='flex gap-3 justify-center'>
					<Button onClick={reset}>Try Again</Button>
					<Button
						variant='outline'
						onClick={() => (window.location.href = "/")}>
						Go Home
					</Button>
				</div>
			</div>
		</div>
	);
}
