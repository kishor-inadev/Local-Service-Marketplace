'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';

import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { requestService } from '@/services/request-service';
import { Search, Grid3X3, List, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const CATEGORY_ICONS: Record<string, string> = {
  'Home Cleaning': '🏠', Plumbing: '🔧', Electrical: '💡', Landscaping: '🌿',
  'Painting': '🎨', Carpentry: '🪚', 'HVAC': '❄️', 'Pest Control': '🐛',
  'Security': '🔒', 'Roofing': '🏗️', Moving: '📦', Tutoring: '📚',
  'Photography': '📷', 'Event Planning': '🎉', default: '🔨',
};

function getCategoryIcon(name: string) {
  return CATEGORY_ICONS[name] ?? CATEGORY_ICONS.default;
}

const CATEGORY_COLORS = [
  'bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-700',
  'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700',
  'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700',
  'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700',
  'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700',
  'bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-700',
  'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700',
  'bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-700',
];

export default function CategoriesPage() {
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => requestService.getCategories(),
    staleTime: 5 * 60 * 1000,
  });

  const filtered = (categories ?? []).filter((cat: any) =>
    !search || cat.name.toLowerCase().includes(search.toLowerCase()) ||
    cat.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-16">
        <div className="container-custom text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Service Categories</h1>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Browse all service categories and find the right professional for your needs
          </p>
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl text-gray-900 dark:text-white bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-white/50 focus:outline-none"
            />
          </div>
        </div>
      </section>

      <div className="container-custom py-12">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-8">
          <p className="text-gray-600 dark:text-gray-400">
            {isLoading ? 'Loading...' : `${filtered.length} categor${filtered.length !== 1 ? 'ies' : 'y'}`}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView('grid')}
              className={`p-2 rounded-md transition-colors ${view === 'grid' ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}>
              <Grid3X3 className="h-5 w-5" />
            </button>
            <button
              onClick={() => setView('list')}
              className={`p-2 rounded-md transition-colors ${view === 'list' ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}>
              <List className="h-5 w-5" />
            </button>
          </div>
        </div>

        {isLoading ? (
          <Loading />
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Grid3X3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No categories found</h3>
            <p className="text-gray-600 dark:text-gray-400">Try a different search term</p>
          </div>
        ) : view === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {filtered.map((cat: any, idx: number) => (
              <Link key={cat.id} href={`/providers?category=${cat.id}`} className="group">
                <div className={`rounded-xl border p-6 text-center transition-all hover:shadow-md hover:-translate-y-1 ${CATEGORY_COLORS[idx % CATEGORY_COLORS.length]}`}>
                  <span className="text-4xl mb-3 block">{getCategoryIcon(cat.name)}</span>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-primary-600">
                    {cat.name}
                  </h3>
                  {cat.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{cat.description}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((cat: any, idx: number) => (
              <Link key={cat.id} href={`/providers?category=${cat.id}`} className="group block">
                <div className={`flex items-center gap-4 rounded-xl border p-5 transition-all hover:shadow-md ${CATEGORY_COLORS[idx % CATEGORY_COLORS.length]}`}>
                  <span className="text-3xl">{getCategoryIcon(cat.name)}</span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-600">
                      {cat.name}
                    </h3>
                    {cat.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">{cat.description}</p>
                    )}
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-16 text-center bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-10">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            Don't see what you need?
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Post a service request and let providers come to you
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/requests/create">
              <Button variant="primary" size="lg">Post a Request</Button>
            </Link>
            <Link href="/providers">
              <Button variant="outline" size="lg">Browse Providers</Button>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
