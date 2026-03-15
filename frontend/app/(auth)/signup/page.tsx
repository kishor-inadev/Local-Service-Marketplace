'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/config/constants';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Select } from '@/components/ui/Select';
import { signupSchema, SignupFormData } from '@/schemas/auth.schema';
import toast from 'react-hot-toast';

export default function SignupPage() {
  const router = useRouter();
  const { signup, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      password: '',
      name: '',
      role: 'customer',
      phone: '',
    },
  });

  const { register, handleSubmit, watch, formState: { errors } } = form;
  const watchPassword = watch('password');

  // Redirect to dashboard if already authenticated (must be in useEffect)
  useEffect(() => {
    if (isAuthenticated) {
      router.push(ROUTES.DASHBOARD);
    }
  }, [isAuthenticated, router]);

  const onSubmit = async (data: any) => {
    setIsLoading(true);

    try {
      await signup(data);
      toast.success('Account created successfully! Please verify your email.');
      router.push(ROUTES.DASHBOARD);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        'Signup failed. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              Sign in
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            {/* Name Field */}
            <div>
              <Input
                label="Full Name"
                type="text"
                {...register('name')}
                error={errors.name?.message}
                disabled={isLoading}
              />
            </div>

            {/* Email Field */}
            <div>
              <Input
                label="Email address"
                type="email"
                {...register('email')}
                error={errors.email?.message}
                autoComplete="email"
                required
                disabled={isLoading}
              />
            </div>

            {/* Phone Field */}
            <div>
              <Input
                label="Phone (optional)"
                type="tel"
                {...register('phone')}
                error={errors.phone?.message}
                placeholder="+1234567890"
                helperText="Format: +[country code][number]"
                disabled={isLoading}
              />
            </div>

            {/* Role Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                I am a <span className="text-red-500">*</span>
              </label>
              <select
                {...register('role')}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.role
                    ? 'border-red-500'
                    : 'border-gray-300'
                }`}
                disabled={isLoading}
              >
                <option value="customer">Customer (Looking for services)</option>
                <option value="provider">Provider (Offering services)</option>
              </select>
              {errors.role && (
                <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <PasswordInput
                label="Password"
                {...register('password')}
                error={errors.password?.message}
                autoComplete="new-password"
                required
                helperText="Min 8 characters, 1 uppercase, 1 lowercase, 1 number"
                disabled={isLoading}
              />
            </div>

            {/* Password Strength Indicator */}
            {watchPassword && watchPassword.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-gray-600">Password strength:</p>
                <div className="flex gap-1">
                  <div
                    className={`h-1 flex-1 rounded ${
                      watchPassword.length >= 8 ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  />
                  <div
                    className={`h-1 flex-1 rounded ${
                      /[A-Z]/.test(watchPassword) && /[a-z]/.test(watchPassword)
                        ? 'bg-green-500'
                        : 'bg-gray-300'
                    }`}
                  />
                  <div
                    className={`h-1 flex-1 rounded ${
                      /[0-9]/.test(watchPassword) ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  />
                </div>
              </div>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            isLoading={isLoading}
            disabled={isLoading}
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </Button>

          {/* Social Login Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">Or continue with</span>
            </div>
          </div>

          {/* Social Login Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              disabled={isLoading}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </button>

            <button
              type="button"
              className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              disabled={isLoading}
            >
              <svg className="w-5 h-5 mr-2" fill="#1877F2" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Facebook
            </button>
          </div>

          <p className="text-xs text-center text-gray-500">
            By signing up, you agree to our{' '}
            <Link href="/terms" className="text-primary-600 hover:text-primary-500">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-primary-600 hover:text-primary-500">
              Privacy Policy
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
