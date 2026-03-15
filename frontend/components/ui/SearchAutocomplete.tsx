'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchService, SearchResult } from '@/services/search-service';
import { Search, Loader2, MapPin, Briefcase, Tag } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/hooks/useDebounce';
import { ROUTES } from '@/config/constants';

interface SearchAutocompleteProps {
  placeholder?: string;
  onSelect?: (result: SearchResult) => void;
  className?: string;
}

export function SearchAutocomplete({
  placeholder = 'Search providers, categories...',
  onSelect,
  className = '',
}: SearchAutocompleteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch search results
  const { data: results = [], isLoading } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () => searchService.searchAll(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
    staleTime: 60000, // Cache for 1 minute
  });

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Open dropdown when typing
  useEffect(() => {
    if (query.length >= 2) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [query]);

  const handleSelect = (result: SearchResult) => {
    setQuery('');
    setIsOpen(false);

    if (onSelect) {
      onSelect(result);
    } else {
      // Default navigation
      if (result.type === 'provider') {
        router.push(ROUTES.PROVIDER_DETAIL(result.id));
      } else if (result.type === 'category') {
        router.push(`${ROUTES.PROVIDERS}?category=${result.id}`);
      }
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'provider':
        return <Briefcase className="h-4 w-4 text-blue-500" />;
      case 'category':
        return <Tag className="h-4 w-4 text-green-500" />;
      case 'location':
        return <MapPin className="h-4 w-4 text-purple-500" />;
      default:
        return <Search className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          {isLoading ? (
            <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
          ) : (
            <Search className="h-5 w-5 text-gray-400" />
          )}
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          placeholder={placeholder}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {/* Dropdown Results */}
      {isOpen && results.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-80 overflow-y-auto"
        >
          <div className="py-2">
            {results.map((result) => (
              <button
                key={`${result.type}-${result.id}`}
                onClick={() => handleSelect(result)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-start gap-3"
              >
                <div className="flex-shrink-0 mt-1">{getIcon(result.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {result.name}
                    </p>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                      {result.type}
                    </span>
                  </div>
                  {result.description && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 truncate">
                      {result.description}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {isOpen && !isLoading && query.length >= 2 && results.length === 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4"
        >
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            No results found for "{query}"
          </p>
        </div>
      )}

      {/* Minimum Query Hint */}
      {isOpen && query.length === 1 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4"
        >
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            Type at least 2 characters to search
          </p>
        </div>
      )}
    </div>
  );
}
