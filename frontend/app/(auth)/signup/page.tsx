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
import { signupSchema, SignupFormData } from '@/schemas/auth.schema';
import toast from 'react-hot-toast';

export default function SignupPage() {
  const router = useRouter();
  const { signup, loginWithGoogle, loginWithFacebook, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid, isDirty },
    setFocus,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    mode: 'onChange', // Enable real-time validation
    defaultValues: {
      email: '',
      password: '',
      name: '',
      userType: 'customer',
      phone: '',
    },
  });

  const watchPassword = watch('password');

  // Auto-focus name field on mount
  useEffect(() => {
    setFocus('name');
  }, [setFocus]);

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push(ROUTES.DASHBOARD);
    }
  }, [isAuthenticated, router]);

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);

    try {
      await signup(data);
      toast.success('🎉 Account created successfully! Welcome aboard!');
      // Redirect to dashboard after successful signup
      router.push(ROUTES.DASHBOARD);
    } catch (error: any) {
      // Handle different error types
      let errorMessage = 'Signup failed. Please try again.';
      
      if (error.message?.includes('email') && error.message?.includes('exists')) {
        errorMessage = 'This email is already registered. Try logging in instead.';
      } else if (error.message?.includes('phone')) {
        errorMessage = 'Invalid phone number format.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      
      // Set focus to first error field
      if (errors.name) setFocus('name');
      else if (errors.email) setFocus('email');
      else if (errors.password) setFocus('password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialSignup = async (provider: 'google' | 'facebook') => {
    try {
      // Use backend OAuth endpoints
      if (provider === 'google') {
        loginWithGoogle();
      } else {
        loginWithFacebook();
      }
    } catch (error) {
      console.error(`${provider} signup error:`, error);
      toast.error(`Failed to sign up with ${provider}. Please try again.`);
    }
  };

  // Determine if submit button should be disabled
  const isSubmitDisabled = isLoading || !isValid || !isDirty;

  // Calculate password strength
  const getPasswordStrength = (password: string): number => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++; // Special characters
    return strength;
  };

  const passwordStrength = watchPassword ? getPasswordStrength(watchPassword) : 0;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-gray-100">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300 focus:outline-none focus:underline"
            >
              Sign in
            </Link>
          </p>
        </div>

        {/* Signup Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-4">
            {/* Name Field */}
            <div>
              <Input
                label="Full Name"
                type="text"
                {...register('name')}
                autoComplete="name"
                autoFocus
                aria-invalid={errors.name ? 'true' : 'false'}
                aria-describedby={errors.name ? 'name-error' : undefined}
                disabled={isLoading}
                className={errors.name ? 'border-red-500 focus:ring-red-500' : ''}
              />
              {errors.name && (
                <p id="name-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <Input
                label="Email address"
                type="email"
                {...register('email')}
                autoComplete="email"
                aria-invalid={errors.email ? 'true' : 'false'}
                aria-describedby={errors.email ? 'email-error' : undefined}
                disabled={isLoading}
                required
                className={errors.email ? 'border-red-500 focus:ring-red-500' : ''}
              />
              {errors.email && (
                <p id="email-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Phone Field */}
            <div>
              <Input
                label="Phone (optional)"
                type="tel"
                {...register('phone')}
                autoComplete="tel"
                placeholder="+1234567890"
                aria-invalid={errors.phone ? 'true' : 'false'}
                aria-describedby={errors.phone ? 'phone-error phone-help' : 'phone-help'}
                disabled={isLoading}
                className={errors.phone ? 'border-red-500 focus:ring-red-500' : ''}
              />
              {errors.phone ? (
                <p id="phone-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                  {errors.phone.message}
                </p>
              ) : (
                <p id="phone-help" className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Format: +[country code][number]
                </p>
              )}
            </div>

            {/* User Type Field */}
            <div>
              <label htmlFor="userType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                I am a <span className="text-red-500">*</span>
              </label>
              <select
                id="userType"
                {...register('userType')}
                aria-invalid={errors.userType ? 'true' : 'false'}
                aria-describedby={errors.userType ? 'userType-error' : undefined}
                disabled={isLoading}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                  errors.userType
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                <option value="customer">Customer (Looking for services)</option>
                <option value="provider">Provider (Offering services)</option>
              </select>
              {errors.userType && (
                <p id="userType-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                  {errors.userType.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <PasswordInput
                label="Password"
                {...register('password')}
                autoComplete="new-password"
                aria-invalid={errors.password ? 'true' : 'false'}
                aria-describedby={errors.password ? 'password-error password-help' : 'password-help'}
                disabled={isLoading}
                required
              />
              {errors.password ? (
                <p id="password-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                  {errors.password.message}
                </p>
              ) : (
                <p id="password-help" className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Min 8 characters, 1 uppercase, 1 lowercase, 1 number
                </p>
              )}
            </div>

            {/* Password Strength Indicator */}
            {watchPassword && watchPassword.length > 0 && (
              <div className="space-y-2" role="status" aria-live="polite">
                <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                  Password strength:
                </p>
                <div className="flex gap-1" aria-label={`Password strength: ${passwordStrength} out of 4`}>
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={`h-1.5 flex-1 rounded transition-colors ${
                        level <= passwordStrength
                          ? passwordStrength === 4
                            ? 'bg-green-500'
                            : passwordStrength === 3
                            ? 'bg-yellow-500'
                            : 'bg-orange-500'
                          : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                      aria-hidden="true"
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {passwordStrength === 4 && '✓ Strong password'}
                  {passwordStrength === 3 && '⚠ Good password'}
                  {passwordStrength === 2 && '⚠ Fair password'}
                  {passwordStrength === 1 && '⚠ Weak password'}
                </p>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            isLoading={isLoading}
            disabled={isSubmitDisabled}
            aria-label={isLoading ? 'Creating account...' : 'Create account'}
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </Button>

          {/* Social Signup Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                Or continue with
              </span>
            </div>
          </div>

          {/* Social Signup Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleSocialSignup('google')}
              disabled={isLoading}
              className="flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Sign up with Google"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" aria-hidden="true">
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
              onClick={() => handleSocialSignup('facebook')}
              disabled={isLoading}
              className="flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Sign up with Facebook"
            >
              <svg className="w-5 h-5 mr-2" fill="#1877F2" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Facebook
            </button>
          </div>

          {/* Terms & Privacy */}
          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
            By signing up, you agree to our{' '}
            <Link href="/terms" className="text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300 focus:outline-none focus:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300 focus:outline-none focus:underline">
              Privacy Policy
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
