import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Star, MapPin, Clock } from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/config/constants';

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

interface ProviderCardProps {
  provider: Provider;
}

export function ProviderCard({ provider }: ProviderCardProps) {
  const hasAvailability = provider.availability && provider.availability.length > 0;
  const serviceCount = provider.services?.length || 0;

  return (
    <Link href={ROUTES.PROVIDER_DETAIL(provider.display_id || provider.id)}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
        <CardHeader>
          <div className="flex items-start gap-4">
            <Avatar name={provider.business_name} size="lg" />
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {provider.business_name}
              </h3>
              {provider.rating && (
                <div className="flex items-center gap-1 mt-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium text-gray-700">
                    {provider.rating.toFixed(1)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {provider.description && (
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
              {provider.description}
            </p>
          )}
          <div className="flex flex-wrap gap-2 mb-3">
            {serviceCount > 0 && (
              <Badge variant="secondary">
                {serviceCount} {serviceCount === 1 ? 'Service' : 'Services'}
              </Badge>
            )}
            {hasAvailability && (
              <Badge variant="success">
                <Clock className="h-3 w-3 mr-1" />
                Available
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
