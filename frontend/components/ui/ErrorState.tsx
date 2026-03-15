import React from 'react';
import { AlertTriangle, XCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';
import { cn } from '@/utils/helpers';

interface ErrorStateProps {
  title?: string;
  message?: string;
  type?: 'error' | 'warning' | 'network';
  retry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'An error occurred while loading this content.',
  type = 'error',
  retry,
  className,
}: ErrorStateProps) {
  const iconMap = {
    error: XCircle,
    warning: AlertTriangle,
    network: RefreshCw,
  };

  const colorMap = {
    error: 'text-red-500',
    warning: 'text-yellow-500',
    network: 'text-blue-500',
  };

  const Icon = iconMap[type];

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center',
        className,
      )}
    >
      <div className={cn('mb-4', colorMap[type])}>
        <Icon className="h-12 w-12" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 max-w-md mb-6">{message}</p>
      {retry && (
        <Button onClick={retry}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      )}
    </div>
  );
}
