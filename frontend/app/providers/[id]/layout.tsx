import type { Metadata } from 'next';

const INTERNAL_API =
	process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3700';

export async function generateMetadata({
	params,
}: {
	params: { id: string };
}): Promise<Metadata> {
	try {
		const res = await fetch(`${INTERNAL_API}/providers/${params.id}`, {
			next: { revalidate: 3600 },
		});

		if (!res.ok) throw new Error('Provider not found');

		const json = await res.json();
		const provider = json.data ?? json;
		const name: string = provider.businessName || provider.name || 'Service Provider';
		const bio: string =
			provider.bio ||
			`View ${name}'s profile, services, reviews, and availability on Local Service Marketplace.`;
		const description = bio.length > 160 ? `${bio.substring(0, 157)}...` : bio;
		const avatar: string | null = provider.profileImage || null;

		return {
			title: `${name} | Service Provider`,
			description,
			alternates: { canonical: `/providers/${params.id}` },
			openGraph: {
				title: `${name} | Local Service Marketplace`,
				description,
				url: `/providers/${params.id}`,
				images: avatar
					? [{ url: avatar, width: 400, height: 400, alt: name }]
					: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Local Service Marketplace' }],
			},
			twitter: {
				card: avatar ? 'summary' : 'summary_large_image',
				title: `${name} | Local Service Marketplace`,
				description,
				images: avatar ? [avatar] : ['/opengraph-image'],
			},
		};
	} catch {
		return {
			title: 'Service Provider',
			description:
				'View service provider profiles, reviews, and availability on Local Service Marketplace.',
			alternates: { canonical: `/providers/${params.id}` },
		};
	}
}

export default function Layout({ children }: { children: React.ReactNode }) {
	return children;
}
