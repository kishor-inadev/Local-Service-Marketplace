'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Dropdown } from '@/components/ui/Dropdown';
import type { DropdownOption } from '@/components/ui/Dropdown';
import { Input } from '@/components/ui/Input';
import { X, Filter } from 'lucide-react';

interface RequestFiltersProps {
  onFilterChange: (_f: Record<string, any>) => void;
  onClear: () => void;
  activeFilters: Record<string, any>;
}

export function RequestFilters({
  onFilterChange,
  onClear,
  activeFilters,
}: RequestFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const statusOptions: DropdownOption[] = [
    { label: 'All Status', value: '' },
    { label: 'Open', value: 'open' },
    { label: 'In Progress', value: 'in_progress' },
    { label: 'Completed', value: 'completed' },
    { label: 'Cancelled', value: 'cancelled' },
  ];

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
    { label: 'Highest Budget', value: 'budget_desc' },
    { label: 'Lowest Budget', value: 'budget_asc' },
  ];

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...activeFilters };
    if (value !== '' && value !== null && value !== undefined) {
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
            <h3 className="text-lg font-semibold">Filter Requests</h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <Dropdown
                  options={statusOptions}
                  value={activeFilters.status || ''}
                  onChange={(value) => handleFilterChange('status', value)}
                  placeholder="Select status"
                />
              </div>

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

              {/* Budget Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Budget
                </label>
                <Input
                  type="number"
                  placeholder="0"
                  value={activeFilters.max_budget || ''}
                  onChange={(e) =>
                    handleFilterChange('max_budget', e.target.value ? Number(e.target.value) : '')
                  }
                  min="0"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
