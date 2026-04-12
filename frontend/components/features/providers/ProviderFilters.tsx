'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Dropdown } from '@/components/ui/Dropdown';
import type { DropdownOption } from '@/components/ui/Dropdown';
import { X, Filter } from 'lucide-react';


interface ProviderFiltersProps {
  onFilterChange: (filters: Record<string, string>) => void;
  onClear: () => void;
  activeFilters: Record<string, string>;
}

export function ProviderFilters({
  onFilterChange,
  onClear,
  activeFilters,
}: ProviderFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const categoryOptions: DropdownOption[] = [
    { label: 'All Categories', value: '' },
    { label: 'Plumbing', value: 'plumbing' },
    { label: 'Electrical', value: 'electrical' },
    { label: 'Carpentry', value: 'carpentry' },
    { label: 'Cleaning', value: 'cleaning' },
    { label: 'Painting', value: 'painting' },
    { label: 'Landscaping', value: 'landscaping' },
  ];

  const sortOptions: DropdownOption[] = [
    { label: 'Most Recent', value: 'recent' },
    { label: 'Highest Rated', value: 'rating' },
    { label: 'Most Popular', value: 'popular' },
  ];

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...activeFilters };
    if (value) {
      newFilters[key] = value;
    } else {
      delete newFilters[key];
    }
    onFilterChange(newFilters);
  };

  const hasActiveFilters = Object.keys(activeFilters).length > 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="outline"
          onClick={() => setIsOpen(!isOpen)}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          Filters
          {hasActiveFilters && (
            <span className="ml-1 px-2 py-0.5 text-xs bg-primary-600 text-white rounded-full">
              {Object.keys(activeFilters).length}
            </span>
          )}
        </Button>
        {hasActiveFilters && (
          <Button variant="ghost" onClick={onClear} className="text-sm">
            <X className="h-4 w-4 mr-1" />
            Clear all
          </Button>
        )}
      </div>

      {isOpen && (
        <Card className="mb-6">
          <CardHeader>
            <h3 className="text-lg font-semibold">Filter Providers</h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <Dropdown
                  options={categoryOptions}
                  value={activeFilters.category_id || ''}
                  onChange={(value) => handleFilterChange('category_id', value)}
                  placeholder="Select category"
                />
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <Dropdown
                  options={sortOptions}
                  value={activeFilters.sort || ''}
                  onChange={(value) => handleFilterChange('sort', value)}
                  placeholder="Select order"
                />
              </div>

              {/* Rating Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Rating
                </label>
                <Dropdown
                  options={[
                    { label: 'Any Rating', value: '' },
                    { label: '4+ Stars', value: '4' },
                    { label: '4.5+ Stars', value: '4.5' },
                    { label: '5 Stars', value: '5' },
                  ]}
                  value={activeFilters.min_rating || ''}
                  onChange={(value) => handleFilterChange('min_rating', value)}
                  placeholder="Select rating"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
