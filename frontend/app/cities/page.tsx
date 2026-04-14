import Link from 'next/link';
import { Layout } from '@/components/layout/Layout';
import { Breadcrumb } from '@/components/shared/Breadcrumb';
import { INDIA_CITIES, SERVICE_SLUGS } from '@/config/seo-data';
import { MapPin } from 'lucide-react';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://localservicemarketplace.com';

const citiesJsonLd = {
	'@context': 'https://schema.org',
	'@type': 'ItemList',
	name: 'Indian Cities Served by Local Service Marketplace',
	url: `${SITE_URL}/cities`,
	numberOfItems: INDIA_CITIES.length,
	itemListElement: INDIA_CITIES.map((city, i) => ({
		'@type': 'ListItem',
		position: i + 1,
		name: city.name,
		url: `${SITE_URL}/services/${SERVICE_SLUGS[0].slug}/${city.slug}`,
	})),
};

export default function CitiesPage() {
	return (
		<Layout>
			<script
				type='application/ld+json'
				dangerouslySetInnerHTML={{ __html: JSON.stringify(citiesJsonLd) }}
			/>
			<div className='bg-white dark:bg-gray-950 min-h-screen'>
				<div className='container-custom py-8 md:py-12'>
					<Breadcrumb items={[{ label: 'Cities', href: '/cities' }]} className='mb-6' />

					<div className='text-center mb-10'>
						<h1 className='text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3'>
							Find Local Services in Your City
						</h1>
						<p className='text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto'>
							Trusted, verified service providers in {INDIA_CITIES.length}+ cities across India. Book home cleaning,
							plumbers, electricians, carpenters and more — instantly.
						</p>
					</div>

					{/* Popular Cities */}
					<div className='mb-12'>
						<h2 className='text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4'>Popular Cities</h2>
						<div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3'>
							{INDIA_CITIES.slice(0, 10).map((city) => (
								<Link
									key={city.slug}
									href={`/services/home-cleaning/${city.slug}`}
									className='flex items-center gap-2 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all group'>
									<MapPin className='h-4 w-4 text-primary-500 shrink-0' />
									<div>
										<p className='font-medium text-gray-900 dark:text-white text-sm group-hover:text-primary-600 dark:group-hover:text-primary-400'>
											{city.name}
										</p>
										<p className='text-xs text-gray-500 dark:text-gray-400'>{city.state}</p>
									</div>
								</Link>
							))}
						</div>
					</div>

					{/* All Cities A-Z */}
					<div>
						<h2 className='text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4'>All Cities</h2>
						<div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2'>
							{[...INDIA_CITIES]
								.sort((a, b) => a.name.localeCompare(b.name))
								.map((city) => (
									<Link
										key={city.slug}
										href={`/services/home-cleaning/${city.slug}`}
										className='flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors'>
										<MapPin className='h-3 w-3 shrink-0 text-gray-400' />
										{city.name}
									</Link>
								))}
						</div>
					</div>

					{/* Services CTA */}
					<div className='mt-12 p-6 bg-primary-50 dark:bg-primary-900/20 rounded-2xl text-center'>
						<h2 className='text-xl font-semibold text-gray-900 dark:text-white mb-2'>
							Browse by Service Category
						</h2>
						<p className='text-gray-600 dark:text-gray-400 mb-4'>
							14 service categories available across all cities
						</p>
						<div className='flex flex-wrap justify-center gap-2'>
							{SERVICE_SLUGS.map((service) => (
								<Link
									key={service.slug}
									href={`/services/${service.slug}/mumbai`}
									className='inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-primary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors'>
									<span>{service.icon}</span>
									{service.name}
								</Link>
							))}
						</div>
					</div>
				</div>
			</div>
		</Layout>
	);
}
