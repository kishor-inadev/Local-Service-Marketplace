import React from 'react';
import { AlertCircle, CheckCircle, Info, XCircle, X } from 'lucide-react';
import { cn } from '@/utils/helpers';

interface AlertProps {
  type?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  message: string;
  onClose?: () => void;
  className?: string;
}

export function Alert({
  type = 'info',
  title,
  message,
  onClose,
  className,
}: AlertProps) {
  const config = {
    info: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      text: 'text-blue-800 dark:text-blue-300',
      icon: <Info className="h-5 w-5 text-blue-400 dark:text-blue-500" />,
    },
    success: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800',
      text: 'text-green-800 dark:text-green-300',
      icon: <CheckCircle className="h-5 w-5 text-green-400 dark:text-green-500" />,
    },
    warning: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      border: 'border-yellow-200 dark:border-yellow-800',
      text: 'text-yellow-800 dark:text-yellow-300',
      icon: <AlertCircle className="h-5 w-5 text-yellow-400 dark:text-yellow-500" />,
    },
    error: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      text: 'text-red-800 dark:text-red-300',
      icon: <XCircle className="h-5 w-5 text-red-400 dark:text-red-500" />,
    },
  };

  const { bg, border, text, icon } = config[type];

  return (
    <div
      className={cn(
        'rounded-md border p-4',
        bg,
        border,
        text,
        className,
      )}
    >
      <div className="flex">
        <div className="flex-shrink-0">{icon}</div>
        <div className="ml-3 flex-1">
          {title && <h3 className="text-sm font-medium">{title}</h3>}
          <div className={cn('text-sm', title && 'mt-2')}>{message}</div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-3 flex-shrink-0 focus:outline-none"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}
