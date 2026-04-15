import type { Metadata } from 'next';
import { Layout } from '@/components/layout/Layout';
import { FAQContent } from './_components/FAQContent';
import { faqs } from './_data/faqs';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://localservicemarketplace.com';

export const metadata: Metadata = {
	title: 'FAQ',
	description:
		'Frequently asked questions about Local Service Marketplace — answers about accounts, services, payments, and more.',
	alternates: { canonical: '/faq' },
	openGraph: {
		title: 'Frequently Asked Questions',
		description:
			'Frequently asked questions about Local Service Marketplace — answers about accounts, services, payments, and more.',
		url: '/faq',
		type: 'website',
		locale: 'en_IN',
		images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Local Service Marketplace' }],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Frequently Asked Questions',
		description:
			'Frequently asked questions about Local Service Marketplace — answers about accounts, services, payments, and more.',
	},
};

const faqJsonLd = {
	'@context': 'https://schema.org',
	'@type': 'FAQPage',
	mainEntity: faqs.map((faq) => ({
		'@type': 'Question',
		name: faq.question,
		acceptedAnswer: {
			'@type': 'Answer',
			text: faq.answer,
		},
	})),
};

const breadcrumbJsonLd = {
	'@context': 'https://schema.org',
	'@type': 'BreadcrumbList',
	itemListElement: [
		{ '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
		{ '@type': 'ListItem', position: 2, name: 'FAQ', item: `${SITE_URL}/faq` },
	],
};

export default function FAQPage() {
	return (
		<Layout>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
			/>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
			/>
			<div className="bg-white dark:bg-gray-900">
				{/* Hero Section */}
				<div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-16">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
						<h1 className="text-4xl md:text-5xl font-bold mb-4">
							Frequently Asked Questions
						</h1>
						<p className="text-xl text-primary-100">
							Find answers to common questions about our platform
						</p>
					</div>
				</div>

				{/* Interactive FAQ content (search, filter, accordion) */}
				<FAQContent />
			</div>
		</Layout>
	);
}
