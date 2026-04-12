import React from 'react';
import { cn } from '@/utils/helpers';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'accent' | 'gradient' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97]';

  const variants = {
    primary:
      'bg-primary-600 text-white hover:bg-primary-500 shadow-sm shadow-primary-600/25 hover:shadow-primary hover:-translate-y-px focus:ring-primary-500 dark:bg-primary-500 dark:hover:bg-primary-400',
    secondary:
      'bg-secondary-600 text-white hover:bg-secondary-500 shadow-sm focus:ring-secondary-500 dark:bg-secondary-500 dark:hover:bg-secondary-400',
    outline:
      'border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-primary-300 dark:hover:border-primary-700 focus:ring-primary-500 shadow-sm',
    danger:
      'bg-red-600 text-white hover:bg-red-500 shadow-sm shadow-red-600/25 hover:shadow-md hover:-translate-y-px focus:ring-red-500',
    ghost:
      'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 focus:ring-primary-500',
    accent:
      'bg-accent-600 text-white hover:bg-accent-500 shadow-sm shadow-accent-600/25 hover:shadow-accent hover:-translate-y-px focus:ring-accent-500',
    gradient:
      'bg-gradient-to-r from-primary-600 to-violet-600 text-white hover:from-primary-500 hover:to-violet-500 shadow-sm shadow-primary-600/30 hover:shadow-primary-lg hover:-translate-y-px focus:ring-primary-500',
    success:
      'bg-accent-600 text-white hover:bg-accent-500 shadow-sm shadow-accent-600/25 hover:shadow-accent hover:-translate-y-px focus:ring-accent-500',
  };

  const sizes = {
    sm: 'px-3.5 py-2 text-sm',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3.5 text-base',
    icon: 'h-9 w-9 p-0',
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      suppressHydrationWarning
      {...props}
    >
      {isLoading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      )}
      {children}
    </button>
  );
}
