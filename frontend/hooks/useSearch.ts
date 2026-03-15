import { useState, useCallback, ChangeEvent } from 'react';
import { useDebounce } from './useDebounce';

interface UseSearchOptions {
  debounceDelay?: number;
  minLength?: number;
}

export function useSearch(options: UseSearchOptions = {}) {
  const { debounceDelay = 300, minLength = 0 } = options;
  
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, debounceDelay);

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  }, []);

  const clear = useCallback(() => {
    setQuery('');
  }, []);

  const isSearching = debouncedQuery.length >= minLength;

  return {
    query,
    debouncedQuery,
    setQuery,
    handleChange,
    clear,
    isSearching,
  };
}
