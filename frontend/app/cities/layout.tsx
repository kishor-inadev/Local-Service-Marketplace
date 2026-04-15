import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Service Cities in India | Local Service Marketplace',
	description:
		'Find verified local service providers in 50+ cities across India. Home services, plumbers, electricians and more in your city.',
	alternates: { canonical: '/cities' },
	openGraph: {
		title: 'Service Cities in India | Local Service Marketplace',
		description:
			'Find trusted local service providers in 50+ Indian cities — Mumbai, Delhi, Bengaluru, Hyderabad and more.',
		url: '/cities',
		type: 'website',
		locale: 'en_IN',
		images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Local Service Marketplace Cities' }],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Service Cities in India | Local Service Marketplace',
		description: 'Find trusted local service providers in 50+ Indian cities.',
		images: ['/opengraph-image'],
	},
};

export default function CitiesLayout({ children }: { children: React.ReactNode }) {
	return children;
}
