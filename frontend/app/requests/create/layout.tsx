import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Post a Service Request',
	description:
		'Post your service request on Local Service Marketplace. Describe what you need, set your budget, and receive proposals from verified local providers.',
	alternates: { canonical: '/requests/create' },
	robots: { index: false, follow: false },
	openGraph: {
		title: 'Post a Service Request',
		description:
			'Post your service request on Local Service Marketplace. Describe what you need, set your budget, and receive proposals from verified local providers.',
		url: '/requests/create',
		images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Local Service Marketplace' }],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Post a Service Request',
		description:
			'Post your service request on Local Service Marketplace. Describe what you need, set your budget, and receive proposals from verified local providers.',
	},
};

export default function Layout({ children }: { children: React.ReactNode }) {
	return children;
}
