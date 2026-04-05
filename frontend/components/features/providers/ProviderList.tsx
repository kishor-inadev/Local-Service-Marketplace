import React from 'react';
import { ProviderCard } from './ProviderCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonCard } from '@/components/ui/Skeleton';

interface Provider {
  id: string;
  display_id?: string;
  business_name: string;
  description?: string;
  rating?: number;
  user_id: string;
  services?: Array<{ id: string; category_id: string }>;
  availability?: Array<{
    id: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
  }>;
}

interface ProviderListProps {
  providers: Provider[];
  isLoading?: boolean;
}

export function ProviderList({ providers, isLoading }: ProviderListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
    );
  }

  if (providers.length === 0) {
    return (
      <EmptyState
        title="No providers found"
        description="Try adjusting your search or filters to find service providers."
        icon="search"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {providers.map((provider) => (
        <ProviderCard key={provider.id} provider={provider} />
      ))}
    </div>
  );
}
