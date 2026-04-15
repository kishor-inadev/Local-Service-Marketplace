import type { Metadata } from 'next';
import { Layout } from '@/components/layout/Layout';
import { PricingSection } from './_components/PricingSection';

export const metadata: Metadata = {
title: 'Pricing Plans',
description:
'View pricing plans and fees for Local Service Marketplace � transparent costs for customers and service providers.',
alternates: { canonical: '/pricing' },
openGraph: {
title: 'Pricing Plans',
description:
'View pricing plans and fees for Local Service Marketplace � transparent costs for customers and service providers.',
url: '/pricing',type: 'website',
locale: 'en_IN',images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Local Service Marketplace' }],
},
twitter: {
card: 'summary_large_image',
title: 'Pricing Plans',
description:
'View pricing plans and fees for Local Service Marketplace � transparent costs for customers and service providers.',
},
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://localservicemarketplace.com';

const pricingJsonLd = {
	'@context': 'https://schema.org',
	'@type': 'WebPage',
	name: 'Pricing Plans � Local Service Marketplace',
	url: `${SITE_URL}/pricing`,
	description: 'View pricing plans and fees for Local Service Marketplace � transparent costs for customers and service providers.',
	isPartOf: { '@type': 'WebSite', name: 'Local Service Marketplace', url: SITE_URL },
};

const breadcrumbJsonLd = {
	'@context': 'https://schema.org',
	'@type': 'BreadcrumbList',
	itemListElement: [
		{ '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
		{ '@type': 'ListItem', position: 2, name: 'Pricing Plans', item: `${SITE_URL}/pricing` },
	],
};

export default function PricingPage() {
return (
<Layout>
<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingJsonLd) }} />
<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
<div className="bg-gray-50 dark:bg-gray-900 py-12">
<div className="container mx-auto px-4">
<PricingSection />
</div>
</div>
</Layout>
);
}
