'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global Error:', error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Application Error
            </h1>
            <p className="text-gray-600 mb-6">
              A critical error has occurred. Please try refreshing the page.
            </p>
            {error.digest && (
              <p className="text-sm text-gray-500 mb-6">
                Error ID: {error.digest}
              </p>
            )}
            <button
              onClick={reset}
              className="px-6 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
