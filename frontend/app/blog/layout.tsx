import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Blog | Home Service Tips & Guides | Local Service Marketplace',
	description:
		'Expert tips on home maintenance, hiring service providers, and getting the best value for home services in India.',
	alternates: { canonical: '/blog' },
	openGraph: {
		title: 'Blog | Home Service Tips & Guides | Local Service Marketplace',
		description: 'Expert tips on home maintenance, hiring service providers, and getting the best value for home services in India.',
		url: '/blog',
		type: 'website',
		images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Local Service Marketplace Blog' }],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Blog | Local Service Marketplace',
		description: 'Expert tips on home maintenance and hiring service providers in India.',
		images: ['/opengraph-image'],
	},
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
	return children;
}
