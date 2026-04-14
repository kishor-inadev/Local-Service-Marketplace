'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { AlertTriangle, X, Mail, Phone } from 'lucide-react';
import { authService } from '@/services/auth-service';
import toast from 'react-hot-toast';

export function VerificationBanner() {
	const { data: session } = useSession();
	const [dismissed, setDismissed] = useState(() => {
		try {
			return sessionStorage.getItem('verification-banner-dismissed') === '1';
		} catch {
			return false;
		}
	});
	const [sending, setSending] = useState(false);

	const user = session?.user;
	if (!user) return null;

	const emailMissing = user.emailVerified === false && !!user.email;
	const phoneMissing = user.phoneVerified === false && !user.emailVerified;

	// Nothing to warn about
	if (!emailMissing && !phoneMissing) return null;
	if (dismissed) return null;

	const handleDismiss = () => {
		try {
			sessionStorage.setItem('verification-banner-dismissed', '1');
		} catch { /* ignore */ }
		setDismissed(true);
	};

	const handleResendEmail = async () => {
		if (!user.email || sending) return;
		setSending(true);
		try {
			await authService.resendVerificationEmail(user.email);
			toast.success('Verification email sent — check your inbox');
		} catch {
			toast.error('Failed to send verification email. Please try again.');
		} finally {
			setSending(false);
		}
	};

	return (
		<div className='w-full bg-amber-50 dark:bg-amber-950 border-b border-amber-200 dark:border-amber-800'>
			<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center gap-3'>
				<AlertTriangle className='h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0' />
				<p className='flex-1 text-sm text-amber-800 dark:text-amber-200'>
					{emailMissing ? (
						<>
							<Mail className='inline h-3.5 w-3.5 mr-1 relative -top-px' />
							Your email address is not verified.{' '}
							<button
								onClick={handleResendEmail}
								disabled={sending}
								className='underline font-medium hover:text-amber-900 dark:hover:text-amber-100 disabled:opacity-60 disabled:cursor-not-allowed'>
								{sending ? 'Sending…' : 'Resend verification email'}
							</button>
						</>
					) : (
						<>
							<Phone className='inline h-3.5 w-3.5 mr-1 relative -top-px' />
							Your phone number is not verified. Please verify it in your account settings.
						</>
					)}
				</p>
				<button
					onClick={handleDismiss}
					aria-label='Dismiss verification banner'
					className='p-1 rounded text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900 flex-shrink-0'>
					<X className='h-4 w-4' />
				</button>
			</div>
		</div>
	);
}
