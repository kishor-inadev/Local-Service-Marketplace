import { useState, useCallback } from 'react';
import { usePublicSettings } from './usePublicSettings';

interface UsePaginationProps {
  initialPage?: number;
  initialLimit?: number; // if omitted, uses default_page_limit from system settings
}

interface UsePaginationReturn {
  page: number;
  limit: number;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  goToPage: (page: number) => void;
  reset: () => void;
}

export function usePagination({
  initialPage = 1,
  initialLimit,
}: UsePaginationProps = {}): UsePaginationReturn {
  const { config } = usePublicSettings();
  const resolvedLimit = initialLimit ?? config.defaultPageLimit;

  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(resolvedLimit);

  const nextPage = useCallback(() => {
    setPage((prev) => prev + 1);
  }, []);

  const previousPage = useCallback(() => {
    setPage((prev) => Math.max(1, prev - 1));
  }, []);

  const goToPage = useCallback((newPage: number) => {
    setPage(Math.max(1, newPage));
  }, []);

  const reset = useCallback(() => {
    setPage(initialPage);
    setLimit(resolvedLimit);
  }, [initialPage, resolvedLimit]);

  return {
    page,
    limit,
    setPage,
    setLimit,
    nextPage,
    previousPage,
    goToPage,
    reset,
  };
}
