"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { authService } from "@/services/auth-service";
import { ROUTES } from "@/config/constants";

export default function VerifyEmailPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const token = searchParams.get("token");

	const [status, setStatus] = useState<"verifying" | "success" | "error" | "no-token">("verifying");
	const [errorMessage, setErrorMessage] = useState("");

	useEffect(() => {
		if (!token) {
			setStatus("no-token");
			return;
		}

		authService
			.verifyEmail(token)
			.then(() => {
				setStatus("success");
				// Redirect to login after 3 seconds
				setTimeout(() => router.push(ROUTES.LOGIN + "?verified=1"), 3000);
			})
			.catch((err: any) => {
				const msg =
					err?.response?.data?.error?.message ||
					err?.response?.data?.message ||
					"The verification link is invalid or has expired.";
				setErrorMessage(msg);
				setStatus("error");
			});
	}, [token, router]);

	return (
		<div className='min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4'>
			<div className='max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 text-center'>
				{status === "verifying" && (
					<>
						<Loader2 className='mx-auto h-16 w-16 text-primary-600 animate-spin mb-4' />
						<h1 className='text-2xl font-bold text-gray-900 dark:text-white mb-2'>Verifying your email…</h1>
						<p className='text-gray-600 dark:text-gray-400'>Please wait a moment.</p>
					</>
				)}

				{status === "success" && (
					<>
						<CheckCircle className='mx-auto h-16 w-16 text-green-500 mb-4' />
						<h1 className='text-2xl font-bold text-gray-900 dark:text-white mb-2'>Email Verified!</h1>
						<p className='text-gray-600 dark:text-gray-400 mb-6'>
							Your email has been successfully verified. You'll be redirected to login shortly.
						</p>
						<Link href={ROUTES.LOGIN}>
							<Button className='w-full'>Go to Login</Button>
						</Link>
					</>
				)}

				{status === "error" && (
					<>
						<XCircle className='mx-auto h-16 w-16 text-red-500 mb-4' />
						<h1 className='text-2xl font-bold text-gray-900 dark:text-white mb-2'>Verification Failed</h1>
						<p className='text-gray-600 dark:text-gray-400 mb-6'>{errorMessage}</p>
						<div className='space-y-3'>
							<Link href={ROUTES.LOGIN}>
								<Button className='w-full'>Back to Login</Button>
							</Link>
							<p className='text-sm text-gray-500 dark:text-gray-400'>
								Need a new link?{" "}
								<Link
									href={ROUTES.LOGIN}
									className='text-primary-600 dark:text-primary-400 hover:underline font-medium'>
									Sign in and we'll send another.
								</Link>
							</p>
						</div>
					</>
				)}

				{status === "no-token" && (
					<>
						<Mail className='mx-auto h-16 w-16 text-gray-400 mb-4' />
						<h1 className='text-2xl font-bold text-gray-900 dark:text-white mb-2'>Check Your Email</h1>
						<p className='text-gray-600 dark:text-gray-400 mb-6'>
							We've sent a verification link to your email address. Click the link in the email to verify your account.
						</p>
						<Link href={ROUTES.LOGIN}>
							<Button
								variant='outline'
								className='w-full'>
								Back to Login
							</Button>
						</Link>
					</>
				)}
			</div>
		</div>
	);
}
