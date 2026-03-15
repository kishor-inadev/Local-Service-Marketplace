'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ROUTES } from '@/config/constants';
import toast from 'react-hot-toast';
import axios from 'axios';

const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const password = watch('password');

  useEffect(() => {
    // Verify token on mount
    const verifyToken = async () => {
      if (!token) {
        setTokenValid(false);
        return;
      }

      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
        await axios.post(`${API_URL}/auth/verify-reset-token`, { token });
        setTokenValid(true);
      } catch (error) {
        setTokenValid(false);
        toast.error('Invalid or expired reset link');
      }
    };

    verifyToken();
  }, [token]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      toast.error('Invalid reset link');
      return;
    }

    setIsSubmitting(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
      await axios.post(`${API_URL}/auth/reset-password`, {
        token,
        password: data.password,
      });

      setResetSuccess(true);
      toast.success('Password reset successfully');
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push(ROUTES.LOGIN);
      }, 3000);
    } catch (error: any) {
      console.error('Reset password error:', error);
      toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state while verifying token
  if (tokenValid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  // Show error if token is invalid
  if (tokenValid === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                <AlertCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Invalid Reset Link
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                This password reset link is invalid or has expired.
              </p>
              <Link
                href="/forgot-password"
                className="inline-block bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-semibold transition"
              >
                Request New Link
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show success message
  if (resetSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Password Reset Successful
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Your password has been reset successfully. You can now log in with your new password.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
                Redirecting to login page...
              </p>
              <Link
                href="/login"
                className="inline-block bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-semibold transition"
              >
                Go to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show reset password form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link
            href="/"
            className="text-3xl font-bold text-primary-600 dark:text-primary-400"
          >
            Local Service Marketplace
          </Link>
          <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
            Reset your password
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Enter your new password below
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  error={errors.password?.message}
                  placeholder="Enter new password"
                  className="pl-10 pr-10"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {password && (
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-gray-600 dark:text-gray-400">Password must contain:</p>
                  <ul className="text-xs space-y-1">
                    <li className={password.length >= 8 ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}>
                      ✓ At least 8 characters
                    </li>
                    <li className={/[A-Z]/.test(password) ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}>
                      ✓ One uppercase letter
                    </li>
                    <li className={/[a-z]/.test(password) ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}>
                      ✓ One lowercase letter
                    </li>
                    <li className={/[0-9]/.test(password) ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}>
                      ✓ One number
                    </li>
                  </ul>
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  {...register('confirmPassword')}
                  error={errors.confirmPassword?.message}
                  placeholder="Confirm new password"
                  className="pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? 'Resetting...' : 'Reset Password'}
            </Button>
          </form>

          <div className="mt-6">
            <Link
              href="/login"
              className="flex items-center justify-center text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
            >
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
