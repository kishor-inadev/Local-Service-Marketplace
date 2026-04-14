import type { Metadata } from 'next';
import { INDIA_CITIES, SERVICE_SLUGS, SERVICE_META } from '@/config/seo-data';

interface Props {
	params: { service: string; city: string };
}

export async function generateStaticParams() {
	const params: { service: string; city: string }[] = [];
	for (const service of SERVICE_SLUGS) {
		for (const city of INDIA_CITIES) {
			params.push({ service: service.slug, city: city.slug });
		}
	}
	return params;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const cityData = INDIA_CITIES.find((c) => c.slug === params.city);
	const serviceMeta = SERVICE_META[params.service];
	const serviceData = SERVICE_SLUGS.find((s) => s.slug === params.service);

	if (!cityData || !serviceData) {
		return { title: 'Service | Local Service Marketplace' };
	}

	const title = `${serviceData.name} in ${cityData.name} | Local Service Marketplace`;
	const description = serviceMeta
		? `${serviceMeta.description} in ${cityData.name}, ${cityData.state}. Compare prices, read reviews and book instantly.`
		: `Find verified ${serviceData.name} professionals in ${cityData.name}. Book online with ratings, reviews and instant quotes.`;

	const url = `/services/${params.service}/${params.city}`;

	return {
		title,
		description,
		keywords: serviceMeta
			? [...serviceMeta.keywords.map((k) => `${k} ${cityData.name}`), `${serviceData.name} ${cityData.name}`]
			: [`${serviceData.name} ${cityData.name}`],
		alternates: { canonical: url },
		openGraph: {
			title,
			description,
			url,
			type: 'website',
			images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: title }],
		},
		twitter: {
			card: 'summary_large_image',
			title,
			description,
			images: ['/opengraph-image'],
		},
	};
}

export default function ServiceCityLayout({ children }: { children: React.ReactNode }) {
	return children;
}
