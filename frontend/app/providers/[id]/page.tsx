'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { ErrorState } from '@/components/ui/ErrorState';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { AvailabilitySchedule } from '@/components/features/providers/AvailabilitySchedule';
import { getProviderProfile } from '@/services/user-service';
import { formatDate } from '@/utils/helpers';
import { ArrowLeft, Star, MapPin, Calendar, Briefcase } from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/config/constants';

export default function ProviderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const providerId = params.id as string;

  const { data: provider, isLoading, error, refetch } = useQuery({
    queryKey: ['provider', providerId],
    queryFn: () => getProviderProfile(providerId),
    enabled: !!providerId,
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="container-custom py-8">
          <Loading />
        </div>
      </Layout>
    );
  }

  if (error || !provider) {
    return (
      <Layout>
        <div className="container-custom py-8">
          <ErrorState
            title="Provider not found"
            message="We couldn't find the provider you're looking for."
            retry={() => refetch()}
          />
        </div>
      </Layout>
    );
  }

  const serviceCount = provider.services?.length || 0;

  return (
    <Layout>
      <div className="container-custom py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Providers
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Card */}
            <Card>
              <CardHeader>
                <div className="flex items-start gap-4">
                  <Avatar name={provider.business_name} size="xl" />
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      {provider.business_name}
                    </h1>
                    {provider.rating && (
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex items-center gap-1">
                          <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                          <span className="text-lg font-semibold text-gray-900">
                            {provider.rating.toFixed(1)}
                          </span>
                        </div>
                        <span className="text-gray-500">Rating</span>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="primary">
                        <Briefcase className="h-3 w-3 mr-1" />
                        {serviceCount} {serviceCount === 1 ? 'Service' : 'Services'}
                      </Badge>
                      <Badge variant="secondary">
                        <Calendar className="h-3 w-3 mr-1" />
                        Joined {formatDate(provider.created_at)}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    About
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {provider.description || 'No description provided.'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Services */}
            {serviceCount > 0 && (
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Services Offered</h3>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {provider.services?.map((service) => (
                      <div
                        key={service.id}
                        className="p-4 border border-gray-200 rounded-lg"
                      >
                        <p className="text-sm text-gray-600">Service ID:</p>
                        <p className="font-medium text-gray-900 truncate">
                          {service.category_id}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Availability */}
            <AvailabilitySchedule availability={provider.availability || []} />

            {/* Contact Card */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Get in Touch</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Link href={ROUTES.CREATE_REQUEST}>
                    <Button className="w-full">Request Service</Button>
                  </Link>
                  <Button variant="outline" className="w-full">
                    Send Message
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
