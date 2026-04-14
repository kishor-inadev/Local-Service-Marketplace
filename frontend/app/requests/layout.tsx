import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Service Requests',
	description:
		'Browse open service requests from customers in your area. Find jobs that match your skills and submit proposals.',
	alternates: { canonical: '/requests' },
	openGraph: {
		title: 'Service Requests',
		description:
			'Browse open service requests from customers in your area. Find jobs that match your skills and submit proposals.',
		url: '/requests',
		images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Local Service Marketplace' }],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Service Requests',
		description:
			'Browse open service requests from customers in your area. Find jobs that match your skills and submit proposals.',
	},
};

export default function Layout({ children }: { children: React.ReactNode }) {
	return children;
}
