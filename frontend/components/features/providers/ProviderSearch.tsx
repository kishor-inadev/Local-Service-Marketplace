'use client';

import React from 'react';
import { SearchBar } from '@/components/shared/SearchBar';

interface ProviderSearchProps {
  value: string;
  onChange: (_v: string) => void;
  onClear: () => void;
}

export function ProviderSearch({ value, onChange, onClear }: ProviderSearchProps) {
  return (
    <SearchBar
      value={value}
      onChange={onChange}
      onClear={onClear}
      placeholder="Search providers by name or service..."
    />
  );
}
