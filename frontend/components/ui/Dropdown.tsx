'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/utils/helpers';
import { ChevronDown } from 'lucide-react';

export interface DropdownOption {
  label: string;
  value: string;
  disabled?: boolean;
}

interface DropdownProps {
  options: DropdownOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function Dropdown({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  className,
  disabled = false,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'w-full px-4 py-2 text-left bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-gray-900 dark:text-gray-100',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
          'flex items-center justify-between',
          disabled && 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-700',
        )}
      >
        <span className={cn(!selectedOption && 'text-gray-500 dark:text-gray-400')}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={cn(
            'h-5 w-5 text-gray-400 dark:text-gray-500 transition-transform',
            isOpen && 'transform rotate-180',
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => !option.disabled && handleSelect(option.value)}
              disabled={option.disabled}
              className={cn(
                'w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-900 dark:text-gray-100',
                option.value === value && 'bg-primary-50 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400',
                option.disabled && 'opacity-50 cursor-not-allowed',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
