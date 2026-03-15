// Analytics utility for tracking user events

interface AnalyticsEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
}

interface PageView {
  path: string;
  title: string;
}

class Analytics {
  private enabled: boolean;
  private debug: boolean;

  constructor() {
    this.enabled = typeof window !== 'undefined' && !!process.env.NEXT_PUBLIC_GA_ID;
    this.debug = process.env.NODE_ENV === 'development';
  }

  /**
   * Track page view
   */
  pageview({ path, title }: PageView) {
    if (!this.enabled) {
      if (this.debug) {
        console.log('[Analytics] Pageview:', { path, title });
      }
      return;
    }

    if (typeof window.gtag !== 'undefined') {
      window.gtag('config', process.env.NEXT_PUBLIC_GA_ID!, {
        page_path: path,
        page_title: title,
      });
    }
  }

  /**
   * Track custom event
   */
  event({ action, category, label, value }: AnalyticsEvent) {
    if (!this.enabled) {
      if (this.debug) {
        console.log('[Analytics] Event:', { action, category, label, value });
      }
      return;
    }

    if (typeof window.gtag !== 'undefined') {
      window.gtag('event', action, {
        event_category: category,
        event_label: label,
        value: value,
      });
    }
  }

  /**
   * Track user interaction
   */
  trackClick(element: string, location: string) {
    this.event({
      action: 'click',
      category: 'engagement',
      label: `${element} - ${location}`,
    });
  }

  /**
   * Track search
   */
  trackSearch(query: string, resultsCount: number) {
    this.event({
      action: 'search',
      category: 'engagement',
      label: query,
      value: resultsCount,
    });
  }

  /**
   * Track form submission
   */
  trackFormSubmit(formName: string, success: boolean) {
    this.event({
      action: 'form_submit',
      category: 'conversion',
      label: formName,
      value: success ? 1 : 0,
    });
  }

  /**
   * Track error
   */
  trackError(error: string, location: string) {
    this.event({
      action: 'error',
      category: 'error',
      label: `${error} - ${location}`,
    });
  }

  /**
   * Track timing
   */
  trackTiming(category: string, variable: string, timeMs: number) {
    if (!this.enabled) {
      if (this.debug) {
        console.log('[Analytics] Timing:', { category, variable, timeMs });
      }
      return;
    }

    if (typeof window.gtag !== 'undefined') {
      window.gtag('event', 'timing_complete', {
        name: variable,
        value: timeMs,
        event_category: category,
      });
    }
  }
}

// Extend Window interface for gtag
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

export const analytics = new Analytics();

// React hook for page view tracking
export function usePageView() {
  if (typeof window === 'undefined') return;

  const pathname = window.location.pathname;
  const title = document.title;

  analytics.pageview({ path: pathname, title });
}
