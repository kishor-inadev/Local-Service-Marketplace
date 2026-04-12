import React from 'react';
import { cn } from '@/utils/helpers';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  count?: number;
}

export function Skeleton({
  className,
  variant = 'rectangular',
  width,
  height,
  count = 1,
}: SkeletonProps) {
  const baseStyles = 'shimmer rounded-lg';

  const variantStyles = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const style = {
    width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined,
    height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined,
  };

  if (count > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className={cn(baseStyles, variantStyles[variant], className)}
            style={style}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(baseStyles, variantStyles[variant], className)}
      style={style}
    />
  );
}

// Predefined skeleton patterns
export function SkeletonCard() {
  return (
    <div className="border border-gray-100 dark:border-gray-800 rounded-2xl p-5 space-y-3 bg-white dark:bg-gray-900">
      <div className="flex items-center gap-3">
        <Skeleton variant="circular" width={44} height={44} />
        <div className="flex-1 space-y-1.5">
          <Skeleton variant="text" width="55%" height={14} />
          <Skeleton variant="text" width="35%" height={12} />
        </div>
      </div>
      <Skeleton variant="rectangular" height={90} />
      <div className="flex gap-2 pt-1">
        <Skeleton variant="rectangular" width={80} height={32} />
        <Skeleton variant="rectangular" width={80} height={32} />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-0 divide-y divide-gray-100 dark:divide-gray-800">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex gap-4 py-3.5 items-center">
          <Skeleton variant="rectangular" width="20%" height={12} />
          <Skeleton variant="rectangular" width="30%" height={12} />
          <Skeleton variant="rectangular" width="25%" height={12} />
          <Skeleton variant="rectangular" width="15%" height={24} className="rounded-full" />
        </div>
      ))}
    </div>
  );
}

/** Stat card skeleton */
export function SkeletonStatCard() {
  return (
    <div className="border border-gray-100 dark:border-gray-800 rounded-2xl p-6 bg-white dark:bg-gray-900">
      <div className="flex items-center justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton variant="text" width="50%" height={12} />
          <Skeleton variant="rectangular" width="40%" height={32} className="mt-2" />
          <Skeleton variant="text" width="60%" height={11} className="mt-1" />
        </div>
        <Skeleton variant="rectangular" width={48} height={48} className="rounded-2xl ml-4 flex-shrink-0" />
      </div>
    </div>
  );
}

/** Row list-item skeleton */
export function SkeletonListItem() {
  return (
    <div className="flex items-start gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg animate-pulse">
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
      </div>
      <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0" />
    </div>
  );
}

export function SkeletonList({ items = 3 }: { items?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="flex gap-4">
          <Skeleton variant="circular" width={48} height={48} />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" width="70%" />
            <Skeleton variant="text" width="50%" />
          </div>
        </div>
      ))}
    </div>
  );
}
