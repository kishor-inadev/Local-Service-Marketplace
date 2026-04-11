import React from 'react';
import { cn, getStatusColor, getStatusLabel } from '@/utils/helpers';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'blue' | 'green' | 'yellow' | 'red' | 'gray' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Badge({
  children,
  variant = 'gray',
  size = 'md',
  className,
}: BadgeProps) {
  const variants = {
    blue: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 ring-1 ring-inset ring-blue-600/20 dark:ring-blue-400/20',
    green: 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 ring-1 ring-inset ring-green-600/20 dark:ring-green-400/20',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 ring-1 ring-inset ring-yellow-600/20 dark:ring-yellow-400/20',
    red: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 ring-1 ring-inset ring-red-600/20 dark:ring-red-400/20',
    gray: 'bg-gray-100 dark:bg-gray-700/60 text-gray-700 dark:text-gray-300 ring-1 ring-inset ring-gray-500/20 dark:ring-gray-400/20',
    primary: 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 ring-1 ring-inset ring-primary-600/20 dark:ring-primary-400/20',
    secondary: 'bg-gray-100 dark:bg-gray-700/60 text-gray-700 dark:text-gray-300 ring-1 ring-inset ring-gray-500/20 dark:ring-gray-400/20',
    success: 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 ring-1 ring-inset ring-green-600/20 dark:ring-green-400/20',
    warning: 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 ring-1 ring-inset ring-yellow-600/20 dark:ring-yellow-400/20',
    danger: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 ring-1 ring-inset ring-red-600/20 dark:ring-red-400/20',
    info: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 ring-1 ring-inset ring-blue-600/20 dark:ring-blue-400/20',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-sm',
    lg: 'px-3 py-1 text-base',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        variants[variant],
        sizes[size],
        className,
      )}
    >
      {children}
    </span>
  );
}

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const color = getStatusColor(status);
  const label = getStatusLabel(status);

  return (
    <Badge variant={color} size={size}>
      {label}
    </Badge>
  );
}
