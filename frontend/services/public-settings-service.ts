/**
 * Public site configuration fetched from /public/site-config.
 * No authentication required — safe to call from server components and
 * client-side hooks alike.
 */
export interface SiteConfig {
  supportEmail: string;
  contactPhone: string;
  contactAddress: string;
  maxFileUploadSizeMb: number;
  allowedFileTypes: string; // comma-separated MIME types
  gstRate: number;
  platformFeePercentage: number;
  currency: string;
  defaultPageLimit: number;
}

export const SITE_CONFIG_DEFAULTS: SiteConfig = {
  supportEmail: 'support@marketplace.com',
  contactPhone: '',
  contactAddress: '',
  maxFileUploadSizeMb: 10,
  allowedFileTypes: 'image/jpeg,image/png,image/webp,application/pdf',
  gstRate: 18,
  platformFeePercentage: 15,
  currency: 'INR',
  defaultPageLimit: 20,
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3700';

/**
 * Fetches site config from the backend.
 * - In Next.js server components: use with `{ next: { revalidate: 300 } }`.
 * - In client components: use `usePublicSettings()` hook instead.
 */
export async function getSiteConfig(): Promise<SiteConfig> {
  try {
    const res = await fetch(`${API_URL}/api/v1/public/site-config`, {
      next: { revalidate: 300 }, // cache for 5 min in RSC
    } as RequestInit);
    if (!res.ok) return SITE_CONFIG_DEFAULTS;
    return (await res.json()) as SiteConfig;
  } catch {
    return SITE_CONFIG_DEFAULTS;
  }
}
