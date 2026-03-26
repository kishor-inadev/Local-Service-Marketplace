import React from 'react';
import { Inbox, Search, FileX, AlertCircle } from 'lucide-react';
import { Button } from './Button';
import { cn } from '@/utils/helpers';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: 'inbox' | 'search' | 'file' | 'alert';
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const icons = {
  inbox: Inbox,
  search: Search,
  file: FileX,
  alert: AlertCircle,
};

export function EmptyState({
  title,
  description,
  icon = 'inbox',
  action,
  className,
}: EmptyStateProps) {
  const Icon = icons[icon];

  return (
		<div className={cn("flex flex-col items-center justify-center py-12 px-4 text-center", className)}>
			<div className='mb-4 rounded-full bg-gray-100 dark:bg-gray-800 p-4'>
				<Icon className='h-10 w-10 text-gray-400 dark:text-gray-500' />
			</div>
			<h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2'>{title}</h3>
			{description && <p className='text-gray-600 dark:text-gray-400 max-w-md mb-6'>{description}</p>}
			{action && <Button onClick={action.onClick}>{action.label}</Button>}
		</div>
	);
}
