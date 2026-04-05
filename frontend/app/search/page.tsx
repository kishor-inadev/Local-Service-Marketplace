'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/Badge';
import { ErrorState } from '@/components/ui/ErrorState';
import { useDebounce } from '@/hooks/useDebounce';
import { getProviders } from '@/services/user-service';
import { requestService } from '@/services/request-service';
import { formatDate, formatCurrency } from '@/utils/helpers';
import { analytics } from '@/utils/analytics';
import { Search, Users, FileText, Tag, MapPin, Star, ArrowRight } from 'lucide-react';
import Link from 'next/link';

type SearchTab = 'all' | 'providers' | 'requests' | 'categories';

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialTab = (searchParams.get('tab') as SearchTab) || 'all';

  const [activeTab, setActiveTab] = useState<SearchTab>(initialTab);
  const [query, setQuery] = useState(initialQuery);
  const debouncedQuery = useDebounce(query, 300);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  }, []);

  const clear = useCallback(() => {
    setQuery('');
  }, []);

  // Update URL params when search changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedQuery) params.set('q', debouncedQuery);
    if (activeTab !== 'all') params.set('tab', activeTab);
    const newUrl = params.toString() ? `/search?${params.toString()}` : '/search';
    router.replace(newUrl, { scroll: false });
  }, [debouncedQuery, activeTab, router]);

  // Fetch providers
  const {
    data: providersData,
    isLoading: providersLoading,
  } = useQuery({
    queryKey: ['search-providers', debouncedQuery],
    queryFn: () => getProviders({ search: debouncedQuery, limit: 10 }),
    enabled: !!debouncedQuery && (activeTab === 'all' || activeTab === 'providers'),
  });

  // Fetch requests
  const {
    data: requestsData,
    isLoading: requestsLoading,
  } = useQuery({
    queryKey: ['search-requests', debouncedQuery],
    queryFn: () => requestService.getRequests({ limit: 10 }),
    enabled: !!debouncedQuery && (activeTab === 'all' || activeTab === 'requests'),
  });

  // Fetch categories
  const {
    data: categoriesData,
    isLoading: categoriesLoading,
  } = useQuery({
    queryKey: ['search-categories'],
    queryFn: () => requestService.getCategories(),
    enabled: activeTab === 'all' || activeTab === 'categories',
  });

  const providers = providersData?.data || [];
  const requests = requestsData?.data || [];
  const categories = categoriesData || [];

  // Filter categories by search query client-side
  const filteredCategories = useMemo(() => {
    if (!debouncedQuery) return categories;
    const q = debouncedQuery.toLowerCase();
    return categories.filter(
      (cat: any) =>
        cat.name?.toLowerCase().includes(q) ||
        cat.description?.toLowerCase().includes(q)
    );
  }, [categories, debouncedQuery]);

  // Filter requests client-side by title/description  
  const filteredRequests = useMemo(() => {
    if (!debouncedQuery) return requests;
    const q = debouncedQuery.toLowerCase();
    return requests.filter(
      (req: any) =>
        req.title?.toLowerCase().includes(q) ||
        req.description?.toLowerCase().includes(q)
    );
  }, [requests, debouncedQuery]);

  const totalResults = providers.length + filteredRequests.length + filteredCategories.length;
  const isLoading = providersLoading || requestsLoading || categoriesLoading;

  useEffect(() => {
    analytics.pageview({ path: '/search', title: 'Search' });
  }, []);

  useEffect(() => {
    if (debouncedQuery) {
      analytics.trackSearch(debouncedQuery, totalResults);
    }
  }, [debouncedQuery, totalResults]);

  const tabs: { key: SearchTab; label: string; count: number; icon: React.ReactNode }[] = [
    { key: 'all', label: 'All', count: totalResults, icon: <Search className="h-4 w-4" /> },
    { key: 'providers', label: 'Providers', count: providers.length, icon: <Users className="h-4 w-4" /> },
    { key: 'requests', label: 'Requests', count: filteredRequests.length, icon: <FileText className="h-4 w-4" /> },
    { key: 'categories', label: 'Categories', count: filteredCategories.length, icon: <Tag className="h-4 w-4" /> },
  ];

  return (
    <Layout>
      <div className="container-custom py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-3">
            Search Marketplace
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Find providers, service requests, and categories
          </p>
        </div>

        {/* Search Input */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search for services, providers, or categories..."
            value={query}
            onChange={handleChange}
            className="w-full pl-12 pr-12 py-4 text-lg border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-shadow"
            autoFocus
          />
          {query && (
            <button
              onClick={() => clear()}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ✕
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              {tab.icon}
              {tab.label}
              {debouncedQuery && (
                <span className="ml-1 text-xs bg-gray-100 dark:bg-gray-700 rounded-full px-2 py-0.5">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Results */}
        {!debouncedQuery ? (
          <EmptyState
            title="Start searching"
            description="Type at least 2 characters to search across providers, requests, and categories."
          />
        ) : isLoading ? (
          <Loading />
        ) : totalResults === 0 ? (
          <EmptyState
            title="No results found"
            description={`No matches for "${debouncedQuery}". Try a different search term.`}
          />
        ) : (
          <div className="space-y-8">
            {/* Providers Section */}
            {(activeTab === 'all' || activeTab === 'providers') && providers.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary-600" />
                    Providers ({providers.length})
                  </h2>
                  {activeTab === 'all' && providers.length > 3 && (
                    <button
                      onClick={() => setActiveTab('providers')}
                      className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                    >
                      View all <ArrowRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {(activeTab === 'all' ? providers.slice(0, 6) : providers).map((provider: any) => (
                    <Link key={provider.id} href={`/providers/${provider.display_id || provider.user_id || provider.id}`}>
                      <Card hover className="h-full">
                        <CardContent className="p-5">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                            {provider.business_name || 'Unnamed Provider'}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                            {provider.description || 'No description'}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            {provider.rating && (
                              <span className="flex items-center gap-1">
                                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                {Number(provider.rating).toFixed(1)}
                              </span>
                            )}
                            {provider.total_jobs_completed != null && (
                              <span>{provider.total_jobs_completed} jobs</span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Requests Section */}
            {(activeTab === 'all' || activeTab === 'requests') && filteredRequests.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Service Requests ({filteredRequests.length})
                  </h2>
                  {activeTab === 'all' && filteredRequests.length > 3 && (
                    <button
                      onClick={() => setActiveTab('requests')}
                      className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                    >
                      View all <ArrowRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="grid gap-4">
                  {(activeTab === 'all' ? filteredRequests.slice(0, 5) : filteredRequests).map((request: any) => (
                    <Link key={request.id} href={`/requests/${request.display_id || request.id}`}>
                      <Card hover>
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-1">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                  {request.title || 'Untitled Request'}
                                </h3>
                                <StatusBadge status={request.status} />
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                                {request.description}
                              </p>
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                {request.budget && <span>{formatCurrency(request.budget)}</span>}
                                {request.location && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3.5 w-3.5" />
                                    {request.location}
                                  </span>
                                )}
                                <span>{formatDate(request.created_at)}</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Categories Section */}
            {(activeTab === 'all' || activeTab === 'categories') && filteredCategories.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Tag className="h-5 w-5 text-green-600" />
                    Categories ({filteredCategories.length})
                  </h2>
                </div>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {filteredCategories.map((category: any) => (
                    <Link key={category.id} href={`/providers?category=${category.id}`}>
                      <Card hover className="h-full">
                        <CardContent className="p-4">
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                            {category.name}
                          </h3>
                          {category.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                              {category.description}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
