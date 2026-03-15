'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { loginSchema, type LoginFormData } from '@/schemas/auth.schema';
import toast from 'react-hot-toast';
import axios from 'axios';

// Phone login schemas
const phoneLoginSchema = z.object({
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format (use +1234567890)').min(10, 'Phone number must be at least 10 digits'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const phoneOtpSchema = z.object({
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format (use +1234567890)').min(10, 'Phone number must be at least 10 digits'),
  code: z.string().length(6, 'OTP code must be 6 digits'),
});

type PhoneLoginFormData = z.infer<typeof phoneLoginSchema>;
type PhoneOtpFormData = z.infer<typeof phoneOtpSchema>;
type LoginMethod = 'email' | 'phone-password' | 'phone-otp';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, setToken } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('email');
  const [otpSent, setOtpSent] = useState(false);
  const [phoneForOtp, setPhoneForOtp] = useState('');

  // Email login form
  const emailForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Phone + password login form
  const phonePasswordForm = useForm<PhoneLoginFormData>({
    resolver: zodResolver(phoneLoginSchema),
    defaultValues: {
      phone: '',
      password: '',
    },
  });

  // Phone + OTP form
  const phoneOtpForm = useForm<PhoneOtpFormData>({
    resolver: zodResolver(phoneOtpSchema),
    defaultValues: {
      phone: '',
      code: '',
    },
  });

  // Redirect to dashboard if already authenticated (must be in useEffect)
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  // Email login handler
  const onEmailSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      await login(data.email, data.password);
      toast.success('Login successful!');
      router.push('/dashboard');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || 
                          error.response?.data?.message || 
                          'Login failed';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Phone + password login handler
  const onPhonePasswordSubmit = async (data: PhoneLoginFormData) => {
    setIsLoading(true);
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/phone/login`,
        data
      );
      
      // Handle standardized response: { success, statusCode, message, data }
      const responseData = response.data?.data || response.data;
      const { accessToken, refreshToken } = responseData;
      setToken(accessToken);
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      
      toast.success('Login successful!');
      router.push('/dashboard');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || 
                          error.response?.data?.message || 
                          'Phone login failed';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Request OTP handler
  const onRequestOtp = async (data: { phone: string }) => {
    setIsLoading(true);
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/phone/otp/request`,
        { phone: data.phone }
      );
      
      setPhoneForOtp(data.phone);
      setOtpSent(true);
      phoneOtpForm.setValue('phone', data.phone);
      toast.success('OTP sent to your phone!');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || 
                          error.response?.data?.message || 
                          'Failed to send OTP';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Verify OTP handler
  const onVerifyOtp = async (data: PhoneOtpFormData) => {
    setIsLoading(true);
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/phone/otp/verify`,
        data
      );
      
      // Handle standardized response: { success, statusCode, message, data }
      const responseData = response.data?.data || response.data;
      const { accessToken, refreshToken } = responseData;
      setToken(accessToken);
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      
      toast.success('Login successful!');
      router.push('/dashboard');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || 
                          error.response?.data?.message || 
                          'OTP verification failed';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (provider: 'google' | 'facebook') => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/${provider}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-gray-100">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Or{' '}
            <Link
              href="/signup"
              className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300"
            >
              create a new account
            </Link>
          </p>
        </div>

        {/* Login Method Selector */}
        <div className="flex space-x-2 border-b border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => {
              setLoginMethod('email');
              setOtpSent(false);
            }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              loginMethod === 'email'
                ? 'border-primary-600 dark:border-primary-400 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Email
          </button>
          <button
            type="button"
            onClick={() => {
              setLoginMethod('phone-password');
              setOtpSent(false);
            }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              loginMethod === 'phone-password'
                ? 'border-primary-600 dark:border-primary-400 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Phone + Password
          </button>
          <button
            type="button"
            onClick={() => {
              setLoginMethod('phone-otp');
              setOtpSent(false);
            }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              loginMethod === 'phone-otp'
                ? 'border-primary-600 dark:border-primary-400 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Phone + OTP
          </button>
        </div>

        {/* Email Login Form */}
        {loginMethod === 'email' && (
          <form className="mt-8 space-y-6" onSubmit={emailForm.handleSubmit(onEmailSubmit)}>
            <div className="space-y-4">
              <div>
                <Input
                  label="Email address"
                  type="email"
                  {...emailForm.register('email')}
                  autoComplete="email"
                />
                {emailForm.formState.errors.email && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {emailForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <PasswordInput
                  label="Password"
                  {...emailForm.register('password')}
                  autoComplete="current-password"
                />
                {emailForm.formState.errors.password && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {emailForm.formState.errors.password.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm">
                <Link
                  href="/forgot-password"
                  className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300"
                >
                  Forgot your password?
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              isLoading={isLoading}
              disabled={isLoading}
            >
              Sign in
            </Button>
          </form>
        )}

        {/* Phone + Password Login Form */}
        {loginMethod === 'phone-password' && (
          <form className="mt-8 space-y-6" onSubmit={phonePasswordForm.handleSubmit(onPhonePasswordSubmit)}>
            <div className="space-y-4">
              <div>
                <Input
                  label="Phone number"
                  type="tel"
                  placeholder="+1234567890"
                  {...phonePasswordForm.register('phone')}
                  autoComplete="tel"
                />
                {phonePasswordForm.formState.errors.phone && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {phonePasswordForm.formState.errors.phone.message}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Include country code (e.g., +1 for US)
                </p>
              </div>

              <div>
                <PasswordInput
                  label="Password"
                  {...phonePasswordForm.register('password')}
                  autoComplete="current-password"
                />
                {phonePasswordForm.formState.errors.password && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {phonePasswordForm.formState.errors.password.message}
                  </p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              isLoading={isLoading}
              disabled={isLoading}
            >
              Sign in with Phone
            </Button>
          </form>
        )}

        {/* Phone + OTP Login Form */}
        {loginMethod === 'phone-otp' && !otpSent && (
          <form className="mt-8 space-y-6" onSubmit={phoneOtpForm.handleSubmit(onRequestOtp)}>
            <div>
              <Input
                label="Phone number"
                type="tel"
                placeholder="+1234567890"
                {...phoneOtpForm.register('phone')}
                autoComplete="tel"
              />
              {phoneOtpForm.formState.errors.phone && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {phoneOtpForm.formState.errors.phone.message}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Include country code (e.g., +1 for US)
              </p>
            </div>

            <Button
              type="submit"
              className="w-full"
              isLoading={isLoading}
              disabled={isLoading}
            >
              Send OTP
            </Button>
          </form>
        )}

        {/* OTP Verification Form */}
        {loginMethod === 'phone-otp' && otpSent && (
          <form className="mt-8 space-y-6" onSubmit={phoneOtpForm.handleSubmit(onVerifyOtp)}>
            <div className="space-y-4">
              <div className="text-center text-sm text-gray-600">
                <p>OTP sent to {phoneForOtp}</p>
                <button
                  type="button"
                  onClick={() => setOtpSent(false)}
                  className="text-primary-600 hover:text-primary-500 font-medium"
                >
                  Change number
                </button>
              </div>

              <div>
                <Input
                  label="Enter 6-digit OTP code"
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  {...phoneOtpForm.register('code')}
                  autoComplete="one-time-code"
                />
                {phoneOtpForm.formState.errors.code && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {phoneOtpForm.formState.errors.code.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => onRequestOtp({ phone: phoneForOtp })}
                disabled={isLoading}
              >
                Resend OTP
              </Button>
              <Button
                type="submit"
                className="flex-1"
                isLoading={isLoading}
                disabled={isLoading}
              >
                Verify & Sign in
              </Button>
            </div>
          </form>
        )}

        {/* Social Login Options */}
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                Or continue with
              </span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleSocialLogin('google')}
              className="w-full inline-flex justify-center items-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
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
              onClick={() => handleSocialLogin('facebook')}
              className="w-full inline-flex justify-center items-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="#1877F2" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Facebook
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
