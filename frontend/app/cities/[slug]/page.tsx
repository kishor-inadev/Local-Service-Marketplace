import { notFound } from 'next/navigation';
import Link from 'next/link';
import { type Metadata } from 'next';
import { Layout } from '@/components/layout/Layout';
import { Breadcrumb } from '@/components/shared/Breadcrumb';
import { INDIA_CITIES, SERVICE_SLUGS } from '@/config/seo-data';
import { MapPin, ArrowRight, Star } from 'lucide-react';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://localservicemarketplace.com';

export function generateStaticParams() {
	return INDIA_CITIES.map((city) => ({ slug: city.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
	const city = INDIA_CITIES.find((c) => c.slug === params.slug);
	if (!city) return {};

	const title = `Home Services in ${city.name} | Local Service Marketplace`;
	const description = `Find verified plumbers, electricians, cleaners, carpenters and 10+ more services in ${city.name}, ${city.state}. Book trusted local professionals instantly.`;
	const url = `${SITE_URL}/cities/${city.slug}`;

	return {
		title,
		description,
		alternates: { canonical: url },
		openGraph: {
			title,
			description,
			url,
			type: 'website',
			locale: 'en_IN',
			images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: title }],
		},
		twitter: { card: 'summary_large_image', title, description, images: ['/opengraph-image'] },
	};
}

export default function CityHubPage({ params }: { params: { slug: string } }) {
	const city = INDIA_CITIES.find((c) => c.slug === params.slug);
	if (!city) notFound();

	const jsonLd = {
		'@context': 'https://schema.org',
		'@type': 'LocalBusiness',
		name: `Local Service Marketplace – ${city.name}`,
		description: `Verified home service providers in ${city.name}, ${city.state}`,
		url: `${SITE_URL}/cities/${city.slug}`,
		areaServed: {
			'@type': 'City',
			name: city.name,
			containedInPlace: { '@type': 'State', name: city.state },
		},
		hasOfferCatalog: {
			'@type': 'OfferCatalog',
			name: 'Home Services',
			itemListElement: SERVICE_SLUGS.map((s, i) => ({
				'@type': 'ListItem',
				position: i + 1,
				item: {
					'@type': 'Service',
					name: s.name,
					description: s.description,
					url: `${SITE_URL}/services/${s.slug}/${city.slug}`,
				},
			})),
		},
	};

	return (
		<Layout>
			<script
				type='application/ld+json'
				dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
			/>
			<div className='bg-white dark:bg-gray-950 min-h-screen'>
				<div className='container-custom py-8 md:py-12'>
					<Breadcrumb
						items={[
							{ label: 'Cities', href: '/cities' },
							{ label: city.name, href: `/cities/${city.slug}` },
						]}
						className='mb-6'
					/>

					{/* Hero */}
					<div className='text-center mb-10'>
						<div className='inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 mb-3'>
							<MapPin className='h-5 w-5' />
							<span className='text-sm font-medium'>
								{city.name}, {city.state}
							</span>
						</div>
						<h1 className='text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3'>
							Home Services in {city.name}
						</h1>
						<p className='text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto'>
							Book verified, background-checked local professionals for all your home service needs in{' '}
							{city.name}. Compare quotes and hire with confidence.
						</p>
					</div>

					{/* Service Grid */}
					<div className='mb-12'>
						<h2 className='text-xl font-semibold text-gray-800 dark:text-gray-200 mb-6'>
							All Services in {city.name}
						</h2>
						<div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4'>
							{SERVICE_SLUGS.map((service) => (
								<Link
									key={service.slug}
									href={`/services/${service.slug}/${city.slug}`}
									className='group flex flex-col items-start gap-2 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all'>
									<span className='text-2xl'>{service.icon}</span>
									<div>
										<p className='font-semibold text-gray-900 dark:text-white text-sm group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors'>
											{service.name}
										</p>
										<p className='text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2'>
											{service.description}
										</p>
									</div>
									<ArrowRight className='h-3.5 w-3.5 text-primary-500 mt-auto opacity-0 group-hover:opacity-100 transition-opacity' />
								</Link>
							))}
						</div>
					</div>

					{/* Trust Signals */}
					<div className='mb-12 grid grid-cols-2 sm:grid-cols-4 gap-4'>
						{[
							{ metric: '500+', label: `Verified providers in ${city.name}` },
							{ metric: '4.8★', label: 'Average rating' },
							{ metric: '30 min', label: 'Average response time' },
							{ metric: '₹0', label: 'Free to post a request' },
						].map(({ metric, label }) => (
							<div
								key={label}
								className='text-center p-4 rounded-xl bg-gray-50 dark:bg-gray-800'>
								<p className='text-2xl font-bold text-primary-600 dark:text-primary-400'>{metric}</p>
								<p className='text-xs text-gray-600 dark:text-gray-400 mt-1'>{label}</p>
							</div>
						))}
					</div>

					{/* Nearby Cities */}
					<div className='mb-10'>
						<h2 className='text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4'>Other Cities</h2>
						<div className='flex flex-wrap gap-2'>
							{INDIA_CITIES.filter((c) => c.slug !== city.slug)
								.slice(0, 20)
								.map((c) => (
									<Link
										key={c.slug}
										href={`/cities/${c.slug}`}
										className='inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-primary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors'>
										<MapPin className='h-3 w-3' />
										{c.name}
									</Link>
								))}
						</div>
					</div>

					{/* CTA */}
					<div className='p-8 bg-primary-50 dark:bg-primary-900/20 rounded-2xl text-center'>
						<Star className='h-8 w-8 text-primary-500 mx-auto mb-3' />
						<h2 className='text-2xl font-bold text-gray-900 dark:text-white mb-2'>
							Need a service in {city.name}?
						</h2>
						<p className='text-gray-600 dark:text-gray-400 mb-6'>
							Post your request for free and get quotes from verified local providers within minutes.
						</p>
						<Link
							href='/signup'
							className='inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors'>
							Post a Request — It&apos;s Free
							<ArrowRight className='h-4 w-4' />
						</Link>
					</div>
				</div>
			</div>
		</Layout>
	);
}
