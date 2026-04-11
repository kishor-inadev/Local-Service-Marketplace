/**
 * Design System Tokens
 * Standardized values for typography, spacing, and layout across the application
 */

export const TYPOGRAPHY = {
  // Page Titles (Hero/Landing)
  hero: {
    size: 'text-5xl sm:text-6xl lg:text-7xl',
    weight: 'font-bold',
    spacing: 'tracking-tight',
    color: 'text-gray-900 dark:text-white',
  },
  
  // Main Page Headings (h1)
  pageTitle: {
    size: 'text-3xl sm:text-4xl',
    weight: 'font-bold',
    spacing: 'tracking-tight',
    color: 'text-gray-900 dark:text-white',
    margin: 'mb-3',
  },
  
  // Section Headings (h2)
  sectionTitle: {
    size: 'text-2xl sm:text-3xl',
    weight: 'font-bold',
    spacing: 'tracking-tight',
    color: 'text-gray-900 dark:text-white',
    margin: 'mb-4',
  },
  
  // Subsection Headings (h3)
  subsectionTitle: {
    size: 'text-xl sm:text-2xl',
    weight: 'font-semibold',
    spacing: '',
    color: 'text-gray-900 dark:text-white',
    margin: 'mb-3',
  },
  
  // Card/Component Titles (h4)
  cardTitle: {
    size: 'text-lg sm:text-xl',
    weight: 'font-semibold',
    spacing: '',
    color: 'text-gray-900 dark:text-white',
    margin: 'mb-2',
  },
  
  // Body Text
  body: {
    size: 'text-base',
    weight: 'font-normal',
    color: 'text-gray-700 dark:text-gray-300',
    lineHeight: 'leading-relaxed',
  },
  
  // Large Body Text
  bodyLarge: {
    size: 'text-lg',
    weight: 'font-normal',
    color: 'text-gray-700 dark:text-gray-300',
    lineHeight: 'leading-relaxed',
  },
  
  // Secondary/Helper Text
  secondary: {
    size: 'text-sm',
    weight: 'font-normal',
    color: 'text-gray-600 dark:text-gray-400',
  },
  
  // Small/Caption Text
  caption: {
    size: 'text-xs',
    weight: 'font-normal',
    color: 'text-gray-500 dark:text-gray-400',
  },
};

export const SPACING = {
  // Page Padding (top/bottom)
  page: {
    top: 'pt-8 sm:pt-12',
    bottom: 'pb-12 sm:pb-16',
    both: 'py-12 sm:py-16',
  },
  
  // Section Spacing
  section: {
    gap: 'space-y-12 sm:space-y-16',
    margin: 'mb-12 sm:mb-16',
  },
  
  // Container Max Width
  container: {
    narrow: 'max-w-2xl',
    default: 'max-w-4xl',
    wide: 'max-w-6xl',
    full: 'max-w-7xl',
  },
  
  // Component Spacing
  component: {
    gap: 'space-y-6',
    margin: 'mb-6',
  },
  
  // Card/Box Padding
  card: {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  },
  
  // Grid Gaps
  grid: {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8',
  },
};

export const COLORS = {
  // Primary Brand Colors
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
  
  // Status Colors
  status: {
    success: 'text-green-600 dark:text-green-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    error: 'text-red-600 dark:text-red-400',
    info: 'text-blue-600 dark:text-blue-400',
  },
  
  // Background Colors
  background: {
    primary: 'bg-gray-50 dark:bg-gray-900',
    secondary: 'bg-white dark:bg-gray-900',
    accent: 'bg-primary-50 dark:bg-primary-900/20',
    hover: 'hover:bg-gray-100 dark:hover:bg-gray-800/60',
  },
  
  // Border Colors
  border: {
    default: 'border-gray-100 dark:border-gray-700/60',
    subtle: 'border-gray-100 dark:border-gray-800',
    strong: 'border-gray-200 dark:border-gray-600',
  },
};

export const LAYOUT = {
  // Standard Widths
  width: {
    narrow: 'max-w-2xl',
    content: 'max-w-4xl',
    wide: 'max-w-6xl',    full: 'max-w-7xl',
  },
  
  // Centering
  center: 'mx-auto',
  
  // Container Pattern
  containerCustom: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
};

// Utility function to combine design tokens
export function getTypographyClasses(variant: keyof typeof TYPOGRAPHY): string {
  const tokens = TYPOGRAPHY[variant];
  if (!tokens) return '';
  
  return Object.values(tokens).filter(Boolean).join(' ');
}

export function getSpacingClasses(type: 'page' | 'section' | 'component', property?: string): string {
  if (type === 'page' && property) {
    return SPACING.page[property as keyof typeof SPACING.page] || '';
  }
  if (type === 'section') {
    return SPACING.section.margin;
  }
  if (type === 'component') {
    return SPACING.component.margin;
  }
  return '';
}

// Component Style Presets
export const COMPONENT_STYLES = {
  // Page Header Pattern
  pageHeader: `${SPACING.page.both} ${SPACING.section.margin}`,
  
  // Section Container Pattern
  section: `${SPACING.section.margin}`,
  
  // Card Pattern
  card: `bg-white dark:bg-gray-800 rounded-lg border ${COLORS.border.default} shadow-sm`,
  
  // Button Pattern (primary)
  buttonPrimary: 'bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors',
  
  // Input Pattern
  input: `w-full px-4 py-2 border ${COLORS.border.strong} rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500`,
};

// Service Marketplace Theme Specific
export const THEME = {
  // Trust Indicators
  badge: {
    verified: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
    featured: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
    topRated: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
  },
  
  // Rating Colors
  rating: {
    star: 'text-yellow-400',
    count: 'text-gray-600 dark:text-gray-400',
  },
  
  // Status Badges
  jobStatus: {
    pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
    active: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
    completed: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
    cancelled: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
  },
};
