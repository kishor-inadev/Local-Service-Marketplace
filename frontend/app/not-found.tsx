'use client';

import Link from 'next/link';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { Home, ArrowLeft } from 'lucide-react';
import { ROUTES } from '@/config/constants';

export default function NotFound() {
  return (
    <Layout>
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center">
          {/* 404 Visual */}
          <div className="mb-8">
            <h1 className="text-9xl font-bold text-primary-600 dark:text-primary-400">
              404
            </h1>
            <div className="mt-4 h-1 w-32 bg-primary-600 dark:bg-primary-400 mx-auto rounded-full"></div>
          </div>

          {/* Message */}
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Page Not Found
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
            Sorry, we couldn't find the page you're looking for. It might have been moved or doesn't exist.
          </p>

          {/* Actions */}
          <div className="flex gap-4 justify-center flex-wrap">
            <Button
              onClick={() => window.history.back()}
              variant="outline"
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Button>
            <Link href={ROUTES.HOME}>
              <Button className="gap-2">
                <Home className="h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>

          {/* Helpful Links */}
          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              You might be looking for:
            </p>
            <div className="flex gap-4 justify-center flex-wrap text-sm">
              <Link href={ROUTES.PROVIDERS} className="text-primary-600 hover:underline">
                Browse Providers
              </Link>
              <Link href={ROUTES.CREATE_REQUEST} className="text-primary-600 hover:underline">
                Post a Request
              </Link>
              <Link href={ROUTES.HOW_IT_WORKS} className="text-primary-600 hover:underline">
                How It Works
              </Link>
              <Link href={ROUTES.HELP} className="text-primary-600 hover:underline">
                Help Center
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
