'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
import { ProviderList } from '@/components/features/providers/ProviderList';
import { ProviderSearch } from '@/components/features/providers/ProviderSearch';
import { ProviderFilters } from '@/components/features/providers/ProviderFilters';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { useSearch } from '@/hooks/useSearch';
import { getProviders } from '@/services/user-service';
import { APP_CONFIG } from '@/config/constants';
import { analytics } from '@/utils/analytics';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function ProvidersPage() {
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const { debouncedQuery, handleChange, clear } = useSearch({ minLength: 2 });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['providers', cursor, debouncedQuery, filters],
    queryFn: () =>
      getProviders({
        limit: APP_CONFIG.PAGE_SIZE,
        cursor,
        search: debouncedQuery || undefined,
        category_id: filters.category_id,
      }),
  });

  const providers = data?.data || [];
  const hasMore = data?.hasMore || false;
  const nextCursor = data?.nextCursor;

  useEffect(() => {
    analytics.pageview({
      path: '/providers',
      title: 'Provider Catalog',
    });
  }, []);

  useEffect(() => {
    if (debouncedQuery) {
      analytics.trackSearch(debouncedQuery, providers.length);
    }
  }, [debouncedQuery, providers.length]);

  const handleNextPage = () => {
    if (nextCursor) {
      setCursor(nextCursor);
    }
  };

  const handlePrevPage = () => {
    setCursor(undefined);
  };

  const handleFilterChange = (newFilters: Record<string, string>) => {
    setFilters(newFilters);
    setCursor(undefined); // Reset pagination on filter change
  };

  const handleClearFilters = () => {
    setFilters({});
    setCursor(undefined);
  };

  return (
    <Layout>
      <div className="container-custom py-12">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-3">
            Find Service Providers
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Browse local service providers and find the perfect match for your needs
          </p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <ProviderSearch
            value={debouncedQuery}
            onChange={(value) => handleChange({ target: { value } } as any)}
            onClear={clear}
          />
        </div>

        {/* Filters */}
        <ProviderFilters
          onFilterChange={handleFilterChange}
          onClear={handleClearFilters}
          activeFilters={filters}
        />

        {/* Error State */}
        {error && (
          <ErrorState
            title="Failed to load providers"
            message="There was an error loading the provider list. Please try again."
            retry={() => refetch()}
          />
        )}

        {/* Provider List */}
        {!error && (
          <>
            <ProviderList providers={providers} isLoading={isLoading} />

            {/* Pagination */}
            {!isLoading && providers.length > 0 && (
              <div className="mt-8 flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={handlePrevPage}
                  disabled={!cursor}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
                <span className="text-sm text-gray-600">
                  Showing {providers.length} providers
                </span>
                <Button
                  variant="outline"
                  onClick={handleNextPage}
                  disabled={!hasMore}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
