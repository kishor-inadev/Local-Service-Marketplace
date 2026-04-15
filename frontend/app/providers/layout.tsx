import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Find Service Providers',
	description:
		'Browse verified local service providers. Find trusted professionals for home repairs, cleaning, tutoring, and more.',
	alternates: { canonical: '/providers' },
	openGraph: {
		title: 'Find Service Providers',
		description:
			'Browse verified local service providers. Find trusted professionals for home repairs, cleaning, tutoring, and more.',
		url: '/providers',
		type: 'website',
		locale: 'en_IN',
		images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Local Service Marketplace' }],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Find Service Providers',
		description:
			'Browse verified local service providers. Find trusted professionals for home repairs, cleaning, tutoring, and more.',
	},
};

export default function Layout({ children }: { children: React.ReactNode }) {
	return children;
}
