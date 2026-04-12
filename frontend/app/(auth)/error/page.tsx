'use client';

import { Suspense, useState } from "react";
import Link from 'next/link';
import { useSearchParams } from "next/navigation";
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/config/constants';
import { authService } from "@/services/auth-service";
import {
  AlertTriangle,
  ShieldAlert,
  Clock,
  Mail,
  RefreshCw,
  XCircle,
} from 'lucide-react';

// Error types with their configurations
const ERROR_CONFIGS = {
  // NextAuth errors
  Configuration: {
    title: 'Configuration Error',
    message: 'There is a problem with the server configuration.',
    icon: AlertTriangle,
    color: 'text-red-500',
    bgColor: 'bg-red-50',
    actions: ['home', 'support'],
  },
  AccessDenied: {
    title: 'Access Denied',
    message: 'You do not have permission to access this resource.',
    icon: ShieldAlert,
    color: 'text-orange-500',
    bgColor: 'bg-orange-50',
    actions: ['login', 'home'],
  },
  Verification: {
    title: 'Email Verification Required',
    message: 'Please verify your email address to continue.',
    icon: Mail,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    actions: ['resend', 'login'],
  },
  CredentialsSignin: {
    title: 'Sign In Failed',
    message: 'Invalid email or password. Please check your credentials and try again.',
    icon: XCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-50',
    actions: ['login', 'forgot-password'],
  },
  SessionRequired: {
    title: 'Session Expired',
    message: 'Your session has expired. Please sign in again to continue.',
    icon: Clock,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50',
    actions: ['login'],
  },
  OAuthSignin: {
    title: 'OAuth Sign In Error',
    message: 'There was a problem signing in with your social account.',
    icon: AlertTriangle,
    color: 'text-red-500',
    bgColor: 'bg-red-50',
    actions: ['login', 'signup'],
  },
  OAuthCallback: {
    title: 'OAuth Callback Error',
    message: 'There was a problem during the OAuth callback process.',
    icon: AlertTriangle,
    color: 'text-red-500',
    bgColor: 'bg-red-50',
    actions: ['login', 'home'],
  },
  EmailCreateAccount: {
    title: 'Account Creation Error',
    message: 'Could not create account with this email. The email may already be in use.',
    icon: Mail,
    color: 'text-red-500',
    bgColor: 'bg-red-50',
    actions: ['login', 'signup'],
  },
  Callback: {
    title: 'Callback Error',
    message: 'There was a problem during the authentication callback.',
    icon: AlertTriangle,
    color: 'text-red-500',
    bgColor: 'bg-red-50',
    actions: ['login', 'home'],
  },
  Default: {
    title: 'Authentication Error',
    message: 'An unexpected authentication error occurred. Please try again.',
    icon: AlertTriangle,
    color: 'text-red-500',
    bgColor: 'bg-red-50',
    actions: ['login', 'home'],
  },
  // Custom errors
  TokenExpired: {
    title: 'Token Expired',
    message: 'Your authentication token has expired. Please sign in again.',
    icon: Clock,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50',
    actions: ['login'],
  },
  InvalidToken: {
    title: 'Invalid Token',
    message: 'The authentication token is invalid or has been tampered with.',
    icon: ShieldAlert,
    color: 'text-red-500',
    bgColor: 'bg-red-50',
    actions: ['login'],
  },
  AccountLocked: {
    title: 'Account Locked',
    message: 'Your account has been locked due to multiple failed login attempts. Please try again later or reset your password.',
    icon: ShieldAlert,
    color: 'text-red-500',
    bgColor: 'bg-red-50',
    actions: ['forgot-password', 'support'],
  },
  EmailNotVerified: {
    title: 'Email Not Verified',
    message: 'Please verify your email address before signing in.',
    icon: Mail,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    actions: ['resend', 'login'],
  },
};

type ErrorType = keyof typeof ERROR_CONFIGS;

// Action button configurations
const ACTION_CONFIGS = {
  login: {
    label: 'Back to Login',
    href: ROUTES.LOGIN,
    variant: 'primary' as const,
  },
  signup: {
    label: 'Create Account',
    href: ROUTES.SIGNUP,
    variant: 'outline' as const,
  },
  home: {
    label: 'Go Home',
    href: ROUTES.HOME,
    variant: 'outline' as const,
  },
  'forgot-password': {
    label: 'Reset Password',
    href: ROUTES.FORGOT_PASSWORD,
    variant: 'outline' as const,
  },
  support: {
    label: 'Contact Support',
    href: '/contact',
    variant: 'outline' as const,
  },
  resend: {
    label: 'Resend Verification Email',
    action: 'resend',
    variant: 'outline' as const,
  },
};

export default function AuthErrorPage() {
	return (
		<Suspense
			fallback={
				<div className='min-h-screen flex items-center justify-center'>
					<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900'></div>
				</div>
			}>
			<AuthErrorContent />
		</Suspense>
	);
}

function AuthErrorContent() {
	const searchParams = useSearchParams();
	const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
	const [resendError, setResendError] = useState<string | null>(null);

	// Get error type from URL query parameter
	const errorType = (searchParams.get("error") || "Default") as ErrorType;
	const config = ERROR_CONFIGS[errorType] || ERROR_CONFIGS.Default;
  const email = searchParams.get("email")?.trim() || "";

	const Icon = config.icon;

	// Handle resend verification email
	const handleResendVerification = async () => {
    setResendMessage(null);
		setResendError(null);

		if (!email) {
			setResendError("Missing email address. Please log in again and retry.");
			return;
		}

		setIsResending(true);
		try {
      await authService.resendVerificationEmail(email);
			setResendMessage("Verification email sent. Please check your inbox.");
		} catch (error) {
			console.error("Resend verification error:", error);
      setResendError("Failed to send verification email. Please try again later.");
		} finally {
			setIsResending(false);
		}
	};

	// Render action button
	const renderActionButton = (actionKey: string, _index: number) => {
		const action = ACTION_CONFIGS[actionKey as keyof typeof ACTION_CONFIGS];
		if (!action) return null;

		// Handle custom actions (like resend)
		if ("action" in action && action.action === "resend") {
			return (
				<Button
					key={actionKey}
					onClick={handleResendVerification}
					variant={action.variant}
					disabled={isResending}
					className='w-full sm:w-auto'>
					{isResending ?
						<>
							<RefreshCw className='h-5 w-5 mr-2 animate-spin' />
							Sending...
						</>
					:	action.label}
				</Button>
			);
		}

		// Regular link buttons
		if ("href" in action) {
			return (
				<Link
					key={actionKey}
					href={action.href}
					className='w-full sm:w-auto'>
					<Button
						variant={action.variant}
						className='w-full'>
						{action.label}
					</Button>
				</Link>
			);
		}

		return null;
	};

	return (
		<div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4 sm:px-6 lg:px-8'>
			<div className='max-w-md w-full'>
				{/* Error Card */}
				<div className='bg-white rounded-2xl shadow-xl overflow-hidden'>
					{/* Icon Section */}
					<div className={`${config.bgColor} px-6 py-8 text-center`}>
						<div className='flex justify-center mb-4'>
							<div className={`rounded-full bg-white p-4 shadow-lg`}>
								<Icon className={`h-12 w-12 ${config.color}`} />
							</div>
						</div>
						<h1 className='text-2xl font-bold text-gray-900 mb-2'>{config.title}</h1>
						<p className='text-gray-600 text-sm leading-relaxed'>{config.message}</p>
					</div>

					{/* Actions Section */}
					<div className='px-6 py-6 bg-gray-50'>
						<div className='flex flex-col sm:flex-row gap-3 justify-center'>
							{config.actions.map((actionKey, index) => renderActionButton(actionKey, index))}
						</div>
						{resendMessage && <p className='mt-3 text-sm text-green-700 text-center'>{resendMessage}</p>}
						{resendError && <p className='mt-3 text-sm text-red-600 text-center'>{resendError}</p>}
					</div>

					{/* Additional Help */}
					<div className='px-6 py-4 bg-white border-t border-gray-100'>
						<p className='text-center text-sm text-gray-500'>
							Need help?{" "}
							<Link
								href='/contact'
								className='text-blue-600 hover:text-blue-700 font-medium underline-offset-2 hover:underline'>
								Contact support
							</Link>
						</p>
					</div>
				</div>

				{/* Debug Info (only in development) */}
				{process.env.NODE_ENV === "development" && (
					<div className='mt-4 p-4 bg-gray-900 text-gray-100 rounded-lg text-xs font-mono'>
						<p className='font-bold mb-2'>Debug Info:</p>
						<p>Error Type: {errorType}</p>
						<p>All Params: {searchParams.toString()}</p>
					</div>
				)}
			</div>
		</div>
	);
}
