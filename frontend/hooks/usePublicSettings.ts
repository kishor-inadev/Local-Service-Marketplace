'use client';

import { useQuery } from '@tanstack/react-query';
import { getSiteConfig, SITE_CONFIG_DEFAULTS, type SiteConfig } from '@/services/public-settings-service';

/**
 * React Query hook that provides the public site configuration (contact info,
 * upload limits, GST rate, platform fee, pagination defaults).
 *
 * - Cached for 5 minutes — a single request is shared across the whole page.
 * - Falls back to sensible defaults so the UI never breaks if the backend is down.
 * - No authentication required.
 *
 * @example
 * const { config } = usePublicSettings();
 * <p>Email: {config.supportEmail}</p>
 */
export function usePublicSettings(): { config: SiteConfig; isLoading: boolean } {
  const { data, isLoading } = useQuery<SiteConfig>({
    queryKey: ['public-site-config'],
    queryFn: getSiteConfig,
    staleTime: 5 * 60 * 1000,   // 5 minutes
    gcTime:    10 * 60 * 1000,  // keep in cache for 10 minutes
    placeholderData: SITE_CONFIG_DEFAULTS,
    retry: 1,
  });

  return { config: data ?? SITE_CONFIG_DEFAULTS, isLoading };
}
