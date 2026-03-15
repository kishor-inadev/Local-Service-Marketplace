'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/config/constants';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import toast from 'react-hot-toast';

// Unified login schema - accepts email OR phone
const loginSchema = z.object({
  identifier: z.string()
    .min(1, 'Email or phone number is required')
    .refine((val) => {
      const type = detectInputType(val);
      return type !== 'unknown';
    }, {
      message: 'Enter a valid email (e.g., user@example.com) or phone (e.g., +1234567890)',
    }),
  password: z.string().min(6, 'Password or OTP must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

// Helper to format phone number as user types (123-456-7890)
const formatPhoneNumber = (value: string): string => {
  // Remove all non-digits
  const digits = value.replace(/\D/g, '');
  
  // Format based on length
  if (digits.length <= 3) {
    return digits;
  } else if (digits.length <= 6) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  } else {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }
};

// Helper to detect if input is email or phone
const detectInputType = (input: string): 'email' | 'phone' | 'unknown' => {
  if (!input || input.trim().length === 0) {
    return 'unknown';
  }
  
  // Email validation: proper email format
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (emailRegex.test(input.trim())) {
    return 'email';
  }
  
  // Phone validation: at least 10 digits (with optional formatting)
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  const digitsOnly = input.replace(/[\s\-\(\)]/g, ''); // Remove formatting
  
  // Check if it's phone format AND has at least 10 digits
  if (phoneRegex.test(input) && digitsOnly.length >= 10) {
    // Must start with + or digit
    if (input.trim().match(/^[\+\d]/)) {
      return 'phone';
    }
  }
  
  return 'unknown';
};

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { 
    login, 
    loginWithPhone,
    loginWithEmailOTP,
    loginWithOTP,
    requestEmailOTP,
    requestOTP,
    loginWithGoogle, 
    loginWithFacebook, 
    isAuthenticated 
  } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'identifier' | 'method' | 'authenticate'>('identifier');
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp' | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [detectedType, setDetectedType] = useState<'email' | 'phone' | 'unknown'>('unknown');
  const [otpValues, setOtpValues] = useState<string[]>(['', '', '', '', '', '']);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  // Backend validation states
  const [checkingIdentifier, setCheckingIdentifier] = useState(false);
  const [identifierExists, setIdentifierExists] = useState<boolean | null>(null);
  const [otpAvailable, setOtpAvailable] = useState<boolean>(false);
  const [availableMethods, setAvailableMethods] = useState<('password' | 'otp')[]>([]);
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Unified form - one field for email OR phone
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid, isDirty },
    setFocus,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
    defaultValues: {
      identifier: '',
      password: '',
    },
  });

  const identifier = watch('identifier');

  // Handle phone number formatting
  const handleIdentifierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Check if it looks like a phone number (starts with digit or +)
    if (value && /^[\d\+]/.test(value)) {
      // If it's a phone number (no @), apply formatting
      if (!value.includes('@')) {
        const formatted = formatPhoneNumber(value);
        e.target.value = formatted;
      }
    }
  };

  // Handle OTP input changes
  const handleOtpChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;
    
    const newOtpValues = [...otpValues];
    newOtpValues[index] = value;
    setOtpValues(newOtpValues);
    
    // Update the form field with combined OTP
    const combinedOtp = newOtpValues.join('');
    setValue('password', combinedOtp, { shouldValidate: true });
    
    // Auto-focus next field
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  // Handle OTP backspace
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Handle OTP paste
  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtpValues = pastedData.split('').concat(['', '', '', '', '', '']).slice(0, 6);
    setOtpValues(newOtpValues);
    setValue('password', pastedData, { shouldValidate: true });
    
    // Focus last filled or first empty field
    const nextIndex = Math.min(pastedData.length, 5);
    otpInputRefs.current[nextIndex]?.focus();
  };

  // Check if identifier exists in backend (debounced)
  const checkIdentifierExists = async (identifierValue: string, type: 'email' | 'phone') => {
    setCheckingIdentifier(true);
    setIdentifierExists(null);
    
    try {
      // Remove phone formatting for API call
      const cleanIdentifier = type === 'phone' 
        ? identifierValue.replace(/\D/g, '') 
        : identifierValue;
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:3500'}/api/v1/auth/check-identifier`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          identifier: cleanIdentifier,
          type 
        }),
      });
      
      const data = await response.json();
      setIdentifierExists(data.exists === true);
      setOtpAvailable(data.otpAvailable === true);
      setAvailableMethods(data.availableMethods || ['password']);
      
      if (data.exists) {
        setStep('method');
      }
    } catch (error) {
      console.error('Error checking identifier:', error);
      // On error, assume identifier exists to not block user (fail open)
      setIdentifierExists(true);
      setOtpAvailable(false); // On error, disable OTP for safety
      setAvailableMethods(['password']); // Only show password on error
      setStep('method');
    } finally {
      setCheckingIdentifier(false);
    }
  };

  // Auto-detect input type and check backend (debounced)
  useEffect(() => {
    // Clear previous timeout
    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
    }
    
    if (identifier && identifier.length > 0) {
      const type = detectInputType(identifier);
      setDetectedType(type);
      
      // If valid format, check backend after 800ms delay
      if (type !== 'unknown') {
        checkTimeoutRef.current = setTimeout(() => {
          checkIdentifierExists(identifier, type);
        }, 800);
      } else {
        setIdentifierExists(null);
        setOtpAvailable(false);
        setAvailableMethods([]);
        setStep('identifier');
      }
    } else {
      setDetectedType('unknown');
      setIdentifierExists(null);
      setOtpAvailable(false);
      setAvailableMethods([]);
      
      // Reset to identifier step if input is cleared
      if (step !== 'identifier') {
        setStep('identifier');
        setLoginMethod(null);
      }
    }
    
    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, [identifier]);

  // Auto-focus identifier field on mount
  useEffect(() => {
    setFocus('identifier');
  }, [setFocus]);

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push(ROUTES.DASHBOARD);
    }
  }, [isAuthenticated, router]);

  // Show message if redirected from signup
  useEffect(() => {
    const message = searchParams.get('message');
    const error = searchParams.get('error');
    
    if (message === 'signup_success') {
      toast.success('Account created successfully! Please log in.');
    }
    
    // Show error messages from URL (e.g., from NextAuth or error page)
    if (error) {
      const errorMessages: Record<string, string> = {
        'CredentialsSignin': 'Invalid email or password.',
        'SessionRequired': 'Please sign in to continue.',
        'TokenExpired': 'Your session has expired. Please sign in again.',
        'EmailNotVerified': 'Please verify your email before signing in.',
        'Default': 'An authentication error occurred. Please try again.',
      };
      toast.error(errorMessages[error] || errorMessages['Default']);
    }
  }, [searchParams]);

  // OTP timer countdown
  useEffect(() => {
    if (otpTimer > 0) {
      const timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpTimer]);

  // Unified submit handler - routes to correct backend based on detected type
  const onSubmit = async (data: LoginFormData) => {
    const type = detectInputType(data.identifier);
    
    // Validate input type is detected
    if (type === 'unknown') {
      toast.error('Please enter a valid email address or phone number');
      setFocus('identifier');
      return;
    }

    setIsLoading(true);

    try {
      if (loginMethod === 'password') {
        // Password authentication
        if (type === 'email') {
          await login(data.identifier, data.password);
        } else {
          await loginWithPhone(data.identifier, data.password);
        }
      } else {
        // OTP authentication
        if (!otpSent) {
          toast.error('Please request OTP first');
          return;
        }
        
        if (type === 'email') {
          await loginWithEmailOTP(data.identifier, data.password);
        } else {
          await loginWithOTP(data.identifier, data.password);
        }
      }
      
      toast.success('Welcome back!');
      router.push(ROUTES.DASHBOARD);
    } catch (error: any) {
      toast.error(error.message || 'Login failed. Please try again.');
      setFocus('password');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle method selection - auto-send OTP if OTP method chosen
  const handleMethodSelect = async (method: 'password' | 'otp') => {
    setLoginMethod(method);
    setStep('authenticate');
    
    // If OTP selected, automatically send OTP
    if (method === 'otp') {
      const type = detectInputType(identifier);
      
      setIsLoading(true);
      
      try {
        if (type === 'email') {
          await requestEmailOTP(identifier);
          toast.success('OTP sent to your email!');
        } else {
          await requestOTP(identifier);
          toast.success('OTP sent to your phone!');
        }
        
        setOtpSent(true);
        setOtpTimer(60);
        
        // Focus on password field (which will be the OTP input)
        setTimeout(() => setFocus('password'), 100);
      } catch (error: any) {
        toast.error(error.message || 'Failed to send OTP');
        setStep('method');
        setLoginMethod(null);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Focus on password field
      setTimeout(() => setFocus('password'), 100);
    }
  };

  // Determine if submit button should be disabled
  const isSubmitDisabled = isLoading || !isValid || !isDirty || step !== 'authenticate' || !loginMethod;

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    try {
      // Use backend OAuth endpoints
      if (provider === 'google') {
        loginWithGoogle();
      } else {
        loginWithFacebook();
      }
    } catch (error) {
      console.error(`${provider} login error:`, error);
      toast.error(`Failed to sign in with ${provider}. Please try again.`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-gray-100">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Or{' '}
            <Link
              href="/signup"
              className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300 focus:outline-none focus:underline"
            >
              create a new account
            </Link>
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center space-x-2 text-sm">
          <div className={`flex items-center ${detectedType !== 'unknown' ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center ${detectedType !== 'unknown' ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'}`}>
              {detectedType !== 'unknown' ? '✓' : '1'}
            </span>
            <span className="ml-2">Enter</span>
          </div>
          <div className="w-8 h-0.5 bg-gray-300 dark:bg-gray-600"></div>
          <div className={`flex items-center ${step === 'authenticate' ? 'text-green-600 dark:text-green-400' : loginMethod ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center ${step === 'authenticate' ? 'bg-green-600 text-white' : loginMethod ? 'bg-blue-600 text-white' : 'bg-gray-300 dark:bg-gray-600 text-white'}`}>
              {step === 'authenticate' ? '✓' : '2'}
            </span>
            <span className="ml-2">Choose</span>
          </div>
          <div className="w-8 h-0.5 bg-gray-300 dark:bg-gray-600"></div>
          <div className={`flex items-center ${step === 'authenticate' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center ${step === 'authenticate' ? 'bg-blue-600 text-white' : 'bg-gray-300 dark:bg-gray-600 text-white'}`}>
              3
            </span>
            <span className="ml-2">Sign in</span>
          </div>
        </div>

        {/* Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-4">
            {/* Step 1: Email/Phone Input */}
            <div>
              <div className="relative">
                <Input
                  label="Email or Phone Number"
                  type="text"
                  {...register('identifier')}
                  onChange={(e) => {
                    handleIdentifierChange(e);
                    register('identifier').onChange(e);
                  }}
                  placeholder="email@example.com or 123-456-7890"
                  autoComplete="username"
                  autoFocus
                  aria-invalid={errors.identifier ? 'true' : 'false'}
                  disabled={isLoading || step === 'authenticate'}
                  className={errors.identifier ? 'border-red-500 focus:ring-red-500' : ''}
                />
                {/* Detection Badge */}
                {detectedType !== 'unknown' && identifier && (
                  <div className="absolute right-3 top-9">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                      {detectedType === 'email' ? '📧 Email' : '📱 Phone'}
                    </span>
                  </div>
                )}
              </div>
              {errors.identifier && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                  {errors.identifier.message}
                </p>
              )}
              {/* Checking backend status */}
              {checkingIdentifier && detectedType !== 'unknown' && (
                <p className="mt-1 text-sm text-blue-600 dark:text-blue-400 flex items-center">
                  <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Checking if {detectedType === 'email' ? 'email' : 'phone'} is registered...
                </p>
              )}
              {/* Not registered message */}
              {!checkingIdentifier && identifierExists === false && detectedType !== 'unknown' && (
                <div className="mt-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    ⚠ This {detectedType === 'email' ? 'email' : 'phone number'} is not registered.
                  </p>
                  <Link 
                    href="/signup" 
                    className="text-sm font-medium text-amber-900 dark:text-amber-100 hover:underline"
                  >
                    Create an account →
                  </Link>
                </div>
              )}
              {/* Format hint */}
              {identifier && detectedType === 'unknown' && !checkingIdentifier && (
                <p className="mt-1 text-sm text-amber-600 dark:text-amber-400">
                  ⚠ Email: user@example.com • Phone: 123-456-7890 (auto-formats as you type)
                </p>
              )}
            </div>

            {/* Step 2: Method Selection (shown only when identifier is valid AND exists) */}
            {(step === 'method' || step === 'authenticate') && identifierExists && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Choose login method
                </label>
                <div className={`grid ${availableMethods.includes('otp') ? 'grid-cols-2' : 'grid-cols-1'} gap-3`}>
                  {/* Password Button - Always Available */}
                  {availableMethods.includes('password') && (
                    <button
                      type="button"
                      onClick={() => handleMethodSelect('password')}
                      disabled={isLoading || checkingIdentifier || step === 'authenticate'}
                      className={`flex items-center justify-center px-4 py-3 rounded-lg border-2 transition-all ${
                        loginMethod === 'password'
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                          : checkingIdentifier
                          ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                          : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-gray-800'
                      } ${step === 'authenticate' && loginMethod !== 'password' ? 'opacity-50' : ''}`}
                    >
                      <span className="text-2xl mr-2">🔐</span>
                      <span className="font-medium">Password</span>
                    </button>
                  )}
                  
                  {/* OTP Button - Only if OTP service is enabled */}
                  {availableMethods.includes('otp') && (
                    <button
                      type="button"
                      onClick={() => handleMethodSelect('otp')}
                      disabled={isLoading || checkingIdentifier || step === 'authenticate'}
                      className={`flex items-center justify-center px-4 py-3 rounded-lg border-2 transition-all ${
                        loginMethod === 'otp'
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                          : checkingIdentifier
                          ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                          : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-gray-800'
                      } ${step === 'authenticate' && loginMethod !== 'otp' ? 'opacity-50' : ''}`}
                    >
                      <span className="text-2xl mr-2">📲</span>
                      <span className="font-medium">OTP</span>
                    </button>
                  )}
                </div>
                
                {/* Success Message */}
                <p className="mt-2 text-sm text-green-600 dark:text-green-400 text-center flex items-center justify-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  {detectedType === 'email' ? 'Email' : 'Phone number'} verified. Choose how to continue.
                </p>
                
                {/* OTP Not Available Notice */}
                {!availableMethods.includes('otp') && (
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                    ℹ️ OTP login currently unavailable. Please use password.
                  </p>
                )}
              </div>
            )}

            {/* Step 3: Authentication Field (appears after method selection) */}
            {step === 'authenticate' && loginMethod === 'password' && (
              <div>
                <PasswordInput
                  label="Password"
                  {...register('password')}
                  autoComplete="current-password"
                  disabled={isLoading}
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                    {errors.password.message}
                  </p>
                )}
              </div>
            )}

            {step === 'authenticate' && loginMethod === 'otp' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Enter 6-Digit OTP
                </label>
                <div className="flex gap-2 justify-between">
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <input
                      key={index}
                      ref={(el) => (otpInputRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={otpValues[index]}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onPaste={index === 0 ? handleOtpPaste : undefined}
                      disabled={isLoading}
                      className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white transition-all"
                      aria-label={`OTP digit ${index + 1}`}
                    />
                  ))}
                  {otpTimer > 0 && (
                    <div className="flex items-center justify-center w-14 h-14 rounded-lg bg-gray-100 dark:bg-gray-700">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {otpTimer}s
                      </span>
                    </div>
                  )}
                </div>
                {/* Hidden input to maintain form compatibility */}
                <input type="hidden" {...register('password')} />
                {otpSent && (
                  <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                    ✓ OTP sent to your {detectedType === 'email' ? 'email' : 'phone'}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Forgot Password Link */}
          {step === 'authenticate' && loginMethod === 'password' && (detectedType === 'email' || detectedType === 'unknown') && (
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <Link
                  href="/forgot-password"
                  className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300 focus:outline-none focus:underline"
                  tabIndex={isLoading ? -1 : 0}
                >
                  Forgot your password?
                </Link>
              </div>
            </div>
          )}

          {/* Submit Button */}
          {step === 'authenticate' && (
            <Button
              type="submit"
              className="w-full"
              isLoading={isLoading}
              disabled={isSubmitDisabled}
              aria-label={isLoading ? 'Signing in...' : 'Sign in'}
            >
              {isLoading ? 'Signing in...' : loginMethod === 'otp' ? 'Verify & Sign in' : 'Sign in'}
            </Button>
          )}

          {/* Back Button (when on authenticate step) */}
          {step === 'authenticate' && !isLoading && (
            <button
              type="button"
              onClick={() => {
                setStep('method');
                setLoginMethod(null);
                setOtpSent(false);
                setOtpTimer(0);
              }}
              className="w-full text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            >
              ← Change login method
            </button>
          )}
        </form>

        {/* Social Login Divider */}
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

        {/* Social Login Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleSocialLogin('google')}
            disabled={isLoading}
            className="flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Sign in with Google"
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
            onClick={() => handleSocialLogin('facebook')}
            disabled={isLoading}
            className="flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Sign in with Facebook"
          >
            <svg className="w-5 h-5 mr-2" fill="#1877F2" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Facebook
          </button>
        </div>
      </div>
    </div>
  );
}
