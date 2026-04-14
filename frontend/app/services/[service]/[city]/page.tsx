import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Layout } from '@/components/layout/Layout';
import { Breadcrumb } from '@/components/shared/Breadcrumb';
import { INDIA_CITIES, SERVICE_SLUGS, SERVICE_META } from '@/config/seo-data';
import { Star, MapPin, Shield, Clock, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://localservicemarketplace.com';

const FAQS: Record<string, { q: string; a: string }[]> = {
	'home-cleaning': [
		{ q: 'How much does home cleaning cost?', a: 'Home cleaning starts from ₹299 for a 1BHK. Prices vary based on the size of your home and type of cleaning (regular vs deep cleaning).' },
		{ q: 'Are cleaning materials included?', a: 'Most professionals bring their own cleaning supplies and equipment. You can confirm this when booking.' },
		{ q: 'How many hours does a cleaning session take?', a: 'A standard cleaning session takes 2-4 hours depending on the size of your home. Deep cleaning may take 4-6 hours.' },
	],
	plumbing: [
		{ q: 'How much does a plumber charge per visit?', a: 'Plumber visit charges start from ₹199. Labour charges for repairs depend on the complexity of the work.' },
		{ q: 'How soon can a plumber arrive?', a: 'For emergency plumbing, technicians can arrive within 1-2 hours in most cities. Standard bookings are scheduled same-day or next-day.' },
		{ q: 'Are repair materials included in the price?', a: 'Labour is included. Material costs (pipes, fittings) are charged separately and the plumber will inform you upfront.' },
	],
	electrical: [
		{ q: 'What does an electrician visit cost?', a: 'Electrician visit charges start from ₹149. Work charges depend on the task — switch replacement, wiring or fan installation.' },
		{ q: 'Can electricians handle emergency power failures?', a: 'Yes, emergency electricians are available 24/7 in major cities. For emergency bookings, use the urgent request feature.' },
		{ q: 'Are all electricians certified?', a: 'Yes, all electricians on our platform undergo license and background verification before onboarding.' },
	],
};

const DEFAULT_FAQS = [
	{ q: 'How do I book a service?', a: 'Post your requirement, receive multiple quotes from verified professionals, compare and accept the best offer.' },
	{ q: 'Are service providers verified?', a: 'Yes, all providers undergo background checks, identity verification and license validation before joining the platform.' },
	{ q: 'What if I am not satisfied with the service?', a: 'We offer a satisfaction guarantee with free rework or refund through our dispute resolution process.' },
];

interface Props {
	params: { service: string; city: string };
}

export default function ServiceCityPage({ params }: Props) {
	const cityData = INDIA_CITIES.find((c) => c.slug === params.city);
	const serviceData = SERVICE_SLUGS.find((s) => s.slug === params.service);
	const serviceMeta = SERVICE_META[params.service];

	if (!cityData || !serviceData) {
		notFound();
	}

	const faqs = FAQS[params.service] || DEFAULT_FAQS;

	const jsonLd = {
		'@context': 'https://schema.org',
		'@type': 'LocalBusiness',
		name: `${serviceData.name} in ${cityData.name}`,
		description: serviceMeta
			? `${serviceMeta.description} in ${cityData.name}, ${cityData.state}.`
			: `Verified ${serviceData.name} professionals in ${cityData.name}.`,
		url: `${SITE_URL}/services/${params.service}/${params.city}`,
		image: `${SITE_URL}/opengraph-image`,
		address: {
			'@type': 'PostalAddress',
			addressLocality: cityData.name,
			addressRegion: cityData.state,
			addressCountry: 'IN',
		},
		priceRange: '₹₹',
		openingHours: 'Mo-Su 06:00-22:00',
		aggregateRating: {
			'@type': 'AggregateRating',
			ratingValue: '4.8',
			bestRating: '5',
			ratingCount: '1200',
		},
	};

	const faqJsonLd = {
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: faqs.map((faq) => ({
			'@type': 'Question',
			name: faq.q,
			acceptedAnswer: { '@type': 'Answer', text: faq.a },
		})),
	};

	const breadcrumbItems = [
		{ label: 'Cities', href: '/cities' },
		{ label: cityData.name, href: `/services/home-cleaning/${cityData.slug}` },
		{ label: serviceData.name, href: `/services/${params.service}/${params.city}` },
	];

	const relatedCities = INDIA_CITIES.filter((c) => c.slug !== params.city).slice(0, 8);
	const relatedServices = SERVICE_SLUGS.filter((s) => s.slug !== params.service).slice(0, 6);

	return (
		<Layout>
			<script type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
			<script type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
			<div className='bg-white dark:bg-gray-950 min-h-screen'>
				<div className='container-custom py-8'>
					<Breadcrumb items={breadcrumbItems} className='mb-6' />

					{/* Hero */}
					<div className='mb-10'>
						<div className='flex items-center gap-2 text-primary-600 dark:text-primary-400 text-sm font-medium mb-2'>
							<MapPin className='h-4 w-4' />
							{cityData.name}, {cityData.state}
						</div>
						<h1 className='text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3'>
							{serviceData.icon} {serviceData.name} in {cityData.name}
						</h1>
						<p className='text-lg text-gray-600 dark:text-gray-400 max-w-2xl mb-6'>
							{serviceMeta
								? `${serviceMeta.description} in ${cityData.name}, ${cityData.state}. All professionals are background-verified and rated by real customers.`
								: `Find verified ${serviceData.name} professionals in ${cityData.name}. Get multiple quotes, compare reviews and book instantly.`}
						</p>
						<div className='flex flex-wrap gap-3'>
							<Link href='/requests/create'>
								<Button size='lg'>Post Your Requirement — Free</Button>
							</Link>
							<Link href={`/search?q=${encodeURIComponent(serviceData.name)}&location=${cityData.name}`}>
								<Button variant='outline' size='lg'>
									Browse Providers in {cityData.name}
								</Button>
							</Link>
						</div>
					</div>

					{/* Trust Badges */}
					<div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl'>
						{[
							{ icon: <Shield className='h-5 w-5 text-green-500' />, label: 'Verified Professionals' },
							{ icon: <Star className='h-5 w-5 text-yellow-500' />, label: '4.8★ Average Rating' },
							{ icon: <Clock className='h-5 w-5 text-blue-500' />, label: 'Same-Day Service' },
							{ icon: <Shield className='h-5 w-5 text-primary-500' />, label: 'Money-Back Guarantee' },
						].map(({ icon, label }) => (
							<div key={label} className='flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300'>
								{icon}
								<span className='font-medium'>{label}</span>
							</div>
						))}
					</div>

					{/* FAQ */}
					<div className='mb-10'>
						<h2 className='text-2xl font-bold text-gray-900 dark:text-white mb-5'>
							Frequently Asked Questions
						</h2>
						<div className='space-y-4'>
							{faqs.map((faq) => (
								<details
									key={faq.q}
									className='group border border-gray-200 dark:border-gray-700 rounded-xl p-4 open:ring-1 open:ring-primary-200 dark:open:ring-primary-800'>
									<summary className='cursor-pointer font-medium text-gray-900 dark:text-white flex justify-between items-center'>
										{faq.q}
										<ChevronRight className='h-4 w-4 text-gray-400 group-open:rotate-90 transition-transform' />
									</summary>
									<p className='mt-3 text-gray-600 dark:text-gray-400 text-sm leading-relaxed'>{faq.a}</p>
								</details>
							))}
						</div>
					</div>

					{/* Related Services in City */}
					<div className='mb-10'>
						<h2 className='text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4'>
							Other Services in {cityData.name}
						</h2>
						<div className='flex flex-wrap gap-2'>
							{relatedServices.map((s) => (
								<Link
									key={s.slug}
									href={`/services/${s.slug}/${params.city}`}
									className='inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 hover:border-primary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors'>
									{s.icon} {s.name}
								</Link>
							))}
						</div>
					</div>

					{/* Same Service in Other Cities */}
					<div>
						<h2 className='text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4'>
							{serviceData.name} in Other Cities
						</h2>
						<div className='flex flex-wrap gap-2'>
							{relatedCities.map((c) => (
								<Link
									key={c.slug}
									href={`/services/${params.service}/${c.slug}`}
									className='inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 hover:border-primary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors'>
									<MapPin className='h-3 w-3' />
									{c.name}
								</Link>
							))}
						</div>
					</div>
				</div>
			</div>
		</Layout>
	);
}
