import React from 'react';
import { cn } from '@/utils/helpers';

interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Avatar({ src, alt, name, size = 'md', className }: AvatarProps) {
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-lg',
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary-400 to-primary-600 text-white font-semibold',
        sizeClasses[size],
        className,
      )}
    >
      {src ? (
        <img src={src} alt={alt || name || 'Avatar'} className="h-full w-full object-cover" />
      ) : (
        <span>{name ? getInitials(name) : '??'}</span>
      )}
    </div>
  );
}
