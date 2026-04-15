import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Service Categories',
	description:
		'Explore all service categories on Local Service Marketplace — from home cleaning and repairs to tutoring, events, and more.',
	alternates: { canonical: '/categories' },
	openGraph: {
		title: 'Service Categories',
		description:
			'Explore all service categories on Local Service Marketplace — from home cleaning and repairs to tutoring, events, and more.',
		url: '/categories',
		type: 'website',
		locale: 'en_IN',
		images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Local Service Marketplace' }],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Service Categories',
		description:
			'Explore all service categories on Local Service Marketplace — from home cleaning and repairs to tutoring, events, and more.',
	},
};

export default function Layout({ children }: { children: React.ReactNode }) {
	return children;
}
