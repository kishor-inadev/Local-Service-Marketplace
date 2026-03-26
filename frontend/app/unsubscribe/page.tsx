'use client';

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, XCircle, Mail, Home } from 'lucide-react';
import Link from 'next/link';
import { notificationService } from '@/services/notification-service';

export default function UnsubscribePage() {
	return (
		<Suspense
			fallback={
				<div className='min-h-screen flex items-center justify-center'>
					<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900'></div>
				</div>
			}>
			<UnsubscribeContent />
		</Suspense>
	);
}

function UnsubscribeContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [status, setStatus] = useState<"loading" | "success" | "error" | "already">("loading");
	const [email, setEmail] = useState("");
	const [message, setMessage] = useState("");

	useEffect(() => {
		const emailParam = searchParams.get("email");
		const tokenParam = searchParams.get("token");

		if (!emailParam) {
			setStatus("error");
			setMessage("No email provided in the unsubscribe link");
			return;
		}

		setEmail(emailParam);
		handleUnsubscribe(emailParam);
	}, [searchParams]);

	const handleUnsubscribe = async (emailAddress: string) => {
		try {
			const data = await notificationService.unsubscribe(emailAddress, "User clicked unsubscribe link");

			if (data.message?.includes("already")) {
				setStatus("already");
				setMessage(`${emailAddress} was already unsubscribed from our emails.`);
			} else {
				setStatus("success");
				setMessage(`${emailAddress} has been successfully unsubscribed from our emails.`);
			}
		} catch (error: any) {
			console.error("Unsubscribe error:", error);
			setStatus("error");
			setMessage(
				error?.response?.data?.error?.message ||
					"An error occurred while processing your request. Please try again later.",
			);
		}
	};

	const handleResubscribe = () => {
		router.push("/dashboard/settings/notifications");
	};

	return (
		<div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4'>
			<div className='max-w-md w-full'>
				<div className='bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center'>
					{/* Icon */}
					<div className='mb-6 flex justify-center'>
						{status === "loading" && <div className='animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600' />}
						{status === "success" && <CheckCircle className='h-16 w-16 text-green-500' />}
						{status === "already" && <CheckCircle className='h-16 w-16 text-blue-500' />}
						{status === "error" && <XCircle className='h-16 w-16 text-red-500' />}
					</div>

					{/* Title */}
					<h1 className='text-2xl font-bold text-gray-900 dark:text-white mb-3'>
						{status === "loading" && "Processing..."}
						{status === "success" && "Unsubscribed Successfully"}
						{status === "already" && "Already Unsubscribed"}
						{status === "error" && "Oops! Something Went Wrong"}
					</h1>

					{/* Message */}
					<p className='text-gray-600 dark:text-gray-300 mb-6'>
						{status === "loading" && "Unsubscribing you from our email list..."}
						{message}
					</p>

					{/* Email Display */}
					{email && (status === "success" || status === "already") && (
						<div className='bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6'>
							<div className='flex items-center justify-center gap-2 text-sm text-gray-700 dark:text-gray-300'>
								<Mail className='h-4 w-4' />
								<span className='font-medium'>{email}</span>
							</div>
						</div>
					)}

					{/* Info Box */}
					{status === "success" && (
						<div className='bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6 text-left'>
							<p className='text-sm text-blue-800 dark:text-blue-300'>
								<strong>What this means:</strong>
							</p>
							<ul className='text-sm text-blue-700 dark:text-blue-400 mt-2 space-y-1 list-disc list-inside'>
								<li>You won't receive promotional emails</li>
								<li>You'll still get transactional emails (job updates, payments)</li>
								<li>You can resubscribe anytime</li>
							</ul>
						</div>
					)}

					{/* Already Unsubscribed Info */}
					{status === "already" && (
						<div className='bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6 text-left'>
							<p className='text-sm text-blue-800 dark:text-blue-300'>
								This email address was previously unsubscribed from our mailing list. You won't receive any promotional
								emails.
							</p>
						</div>
					)}

					{/* Action Buttons */}
					<div className='space-y-3'>
						{(status === "success" || status === "already") && (
							<>
								<button
									onClick={handleResubscribe}
									className='w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl'>
									Resubscribe to Emails
								</button>
								<Link
									href='/dashboard/settings/notifications'
									className='block w-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors'>
									Manage Notification Preferences
								</Link>
							</>
						)}

						<Link
							href='/'
							className='flex items-center justify-center gap-2 w-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors'>
							<Home className='h-4 w-4' />
							Back to Home
						</Link>
					</div>

					{/* Support Link */}
					<p className='mt-6 text-sm text-gray-500 dark:text-gray-400'>
						Having trouble?{" "}
						<Link
							href='/contact'
							className='text-blue-600 dark:text-blue-400 hover:underline'>
							Contact Support
						</Link>
					</p>
				</div>

				{/* Footer Note */}
				<p className='mt-6 text-center text-xs text-gray-500 dark:text-gray-400'>
					Note: Unsubscribing only affects promotional emails. You'll still receive important transactional emails
					related to your account activity and orders.
				</p>
			</div>
		</div>
	);
}
