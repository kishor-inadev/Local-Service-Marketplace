'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from "next-auth/react";
import { ROUTES } from '@/config/constants';
import { Loading } from '@/components/ui/Loading';
import toast from 'react-hot-toast';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
		const handleCallback = async () => {
			try {
				// Get token from URL parameters
				const token = searchParams.get("token");
				const refreshToken = searchParams.get("refresh");

				if (!token) {
					setError("No authentication token received");
					toast.error("Authentication failed. Please try again.");
					setTimeout(() => router.push(ROUTES.LOGIN), 2000);
					return;
				}

				// Create a NextAuth session from the backend-issued OAuth tokens
				const result = await signIn("oauth-token", { token, refreshToken: refreshToken || "", redirect: false });

				if (result?.error) {
					throw new Error("Failed to create session. Please try again.");
				}

				toast.success("Login successful!");

				// Redirect to dashboard
				router.push(ROUTES.DASHBOARD);
			} catch (error: any) {
				console.error("OAuth callback error:", error);
				setError(error.message || "Authentication failed");
				toast.error("Authentication failed. Please try again.");
				setTimeout(() => router.push(ROUTES.LOGIN), 2000);
			}
		};

		handleCallback();
	}, [searchParams, router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <svg
              className="mx-auto h-12 w-12 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h2 className="mt-4 text-xl font-semibold text-gray-900">
              Authentication Failed
            </h2>
            <p className="mt-2 text-gray-600">{error}</p>
            <p className="mt-4 text-sm text-gray-500">
              Redirecting to login page...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center">
        <Loading />
        <p className="mt-4 text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={<Loading />}>
      <CallbackContent />
    </Suspense>
  );
}
