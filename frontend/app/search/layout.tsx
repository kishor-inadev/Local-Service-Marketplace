import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Search Service Providers | Local Service Marketplace',
	description:
		'Search for verified local service providers near you — plumbers, electricians, cleaners, carpenters and more across 50+ Indian cities.',
	alternates: { canonical: '/search' },
	openGraph: {
		title: 'Search Service Providers | Local Service Marketplace',
		description:
			'Find trusted, verified local service providers near you. Compare ratings, read reviews and book instantly.',
		url: '/search',
		type: 'website',
		images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Search Local Service Marketplace' }],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Search Service Providers | Local Service Marketplace',
		description:
			'Find trusted, verified local service providers near you. Compare ratings, read reviews and book instantly.',
		images: ['/opengraph-image'],
	},
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
