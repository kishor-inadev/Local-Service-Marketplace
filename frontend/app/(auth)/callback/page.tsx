'use client';

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { ROUTES } from '@/config/constants';
import toast from 'react-hot-toast';

export default function AuthCallbackPage() {
	return (
		<Suspense
			fallback={
				<div className='min-h-screen flex items-center justify-center'>
					<div className='animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600'></div>
				</div>
			}>
			<AuthCallbackContent />
		</Suspense>
	);
}

function AuthCallbackContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

	useEffect(() => {
		const handleCallback = async () => {
			const token = searchParams.get("token");
			const refreshToken = searchParams.get("refresh");
			const error = searchParams.get("error");

			// Handle OAuth errors
			if (error) {
				setStatus("error");
				toast.error("Authentication failed. Please try again.");
				setTimeout(() => {
					router.push(ROUTES.LOGIN);
				}, 2000);
				return;
			}

			// Handle OAuth success
			if (token && refreshToken) {
				try {
					setStatus("loading");

					// Store tokens and create NextAuth session
					// We'll use a cookie to pass the tokens to NextAuth
					document.cookie = `oauth-token=${token}; path=/; max-age=3600; SameSite=Lax`;
					document.cookie = `oauth-refresh=${refreshToken}; path=/; max-age=3600; SameSite=Lax`;

					// Create session with the OAuth tokens
					// This is a workaround - in production, consider using a backend endpoint
					// to validate the tokens and create a proper session
					const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/user/auth/verify-token`, {
						headers: { Authorization: `Bearer ${token}` },
					});

					if (response.ok) {
						const userData = await response.json();

						// Sign in with credentials using the token
						// This will create a NextAuth session
						const result = await signIn("credentials", { email: userData.user?.email, token: token, redirect: false });

						if (result?.ok) {
							setStatus("success");
							toast.success("Successfully logged in!");
							router.push(ROUTES.DASHBOARD);
						} else {
							throw new Error("Failed to create session");
						}
					} else {
						throw new Error("Invalid token");
					}
				} catch (err) {
					console.error("OAuth callback error:", err);
					setStatus("error");
					toast.error("Failed to complete authentication. Please try again.");
					setTimeout(() => {
						router.push(ROUTES.LOGIN);
					}, 2000);
				}
			} else {
				setStatus("error");
				toast.error("Invalid authentication response.");
				setTimeout(() => {
					router.push(ROUTES.LOGIN);
				}, 2000);
			}
		};

		handleCallback();
	}, [searchParams, router]);

	return (
		<div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50'>
			<div className='max-w-md w-full'>
				<div className='bg-white rounded-2xl shadow-xl p-8 text-center'>
					{status === "loading" && (
						<>
							<div className='flex justify-center mb-4'>
								<div className='animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600'></div>
							</div>
							<h2 className='text-2xl font-bold text-gray-900 mb-2'>Completing Sign In...</h2>
							<p className='text-gray-600'>Please wait while we finalize your authentication.</p>
						</>
					)}

					{status === "success" && (
						<>
							<div className='flex justify-center mb-4'>
								<div className='rounded-full bg-green-100 p-4'>
									<svg
										className='h-16 w-16 text-green-600'
										fill='none'
										viewBox='0 0 24 24'
										stroke='currentColor'>
										<path
											strokeLinecap='round'
											strokeLinejoin='round'
											strokeWidth={2}
											d='M5 13l4 4L19 7'
										/>
									</svg>
								</div>
							</div>
							<h2 className='text-2xl font-bold text-gray-900 mb-2'>Success!</h2>
							<p className='text-gray-600'>Redirecting to your dashboard...</p>
						</>
					)}

					{status === "error" && (
						<>
							<div className='flex justify-center mb-4'>
								<div className='rounded-full bg-red-100 p-4'>
									<svg
										className='h-16 w-16 text-red-600'
										fill='none'
										viewBox='0 0 24 24'
										stroke='currentColor'>
										<path
											strokeLinecap='round'
											strokeLinejoin='round'
											strokeWidth={2}
											d='M6 18L18 6M6 6l12 12'
										/>
									</svg>
								</div>
							</div>
							<h2 className='text-2xl font-bold text-gray-900 mb-2'>Authentication Failed</h2>
							<p className='text-gray-600'>Redirecting to login page...</p>
						</>
					)}
				</div>
			</div>
		</div>
	);
}
