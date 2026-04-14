import type { Metadata } from 'next';
import { Layout } from '@/components/layout/Layout';
import { Mail, Phone, MapPin } from 'lucide-react';
import { ContactForm } from './_components/ContactForm';

export const metadata: Metadata = {
title: 'Contact Us',
description:
'Get in touch with the Local Service Marketplace team. We are here to help with questions, feedback, and support.',
alternates: { canonical: '/contact' },
openGraph: {
title: 'Contact Us',
description:
'Get in touch with the Local Service Marketplace team. We are here to help with questions, feedback, and support.',
url: '/contact',
images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Local Service Marketplace' }],
},
twitter: {
card: 'summary_large_image',
title: 'Contact Us',
description:
'Get in touch with the Local Service Marketplace team. We are here to help with questions, feedback, and support.',
},
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://localservicemarketplace.com';

const contactPageJsonLd = {
	'@context': 'https://schema.org',
	'@type': 'ContactPage',
	name: 'Contact Local Service Marketplace',
	url: `${SITE_URL}/contact`,
	description: 'Get in touch with the Local Service Marketplace team for support and inquiries.',
	isPartOf: { '@type': 'WebSite', name: 'Local Service Marketplace', url: SITE_URL },
};

const contactOrgJsonLd = {
	'@context': 'https://schema.org',
	'@type': 'Organization',
	name: 'Local Service Marketplace',
	url: SITE_URL,
	contactPoint: {
		'@type': 'ContactPoint',
		email: 'support@localservicemarketplace.com',
		contactType: 'customer service',
		availableLanguage: 'English',
	},
};

export default function ContactPage() {
return (
<Layout>
<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(contactPageJsonLd) }} />
<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(contactOrgJsonLd) }} />
<div className="bg-white dark:bg-gray-900">
{/* Hero Section */}
<div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-16">
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
<h1 className="text-4xl md:text-5xl font-bold mb-4">Contact Us</h1>
<p className="text-xl text-primary-100">We&apos;re here to help. Get in touch with us.</p>
</div>
</div>

<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
<div className="grid md:grid-cols-2 gap-12">
{/* Contact Form — client island */}
<ContactForm />

{/* Contact Information — static, server-rendered */}
<div>
<h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
Contact Information
</h2>

<div className="space-y-6">
<div className="flex items-start">
<div className="flex-shrink-0">
<div className="flex items-center justify-center w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
<Mail className="w-6 h-6 text-primary-600 dark:text-primary-400" />
</div>
</div>
<div className="ml-4">
<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Email</h3>
<a
href="mailto:support@localservicemarketplace.com"
className="text-primary-600 dark:text-primary-400 hover:underline"
>
support@localservicemarketplace.com
</a>
</div>
</div>

<div className="flex items-start">
<div className="flex-shrink-0">
<div className="flex items-center justify-center w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
<Phone className="w-6 h-6 text-primary-600 dark:text-primary-400" />
</div>
</div>
<div className="ml-4">
<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Phone</h3>
<p className="text-gray-600 dark:text-gray-400">
Available via email or in-app messaging
</p>
</div>
</div>

<div className="flex items-start">
<div className="flex-shrink-0">
<div className="flex items-center justify-center w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
<MapPin className="w-6 h-6 text-primary-600 dark:text-primary-400" />
</div>
</div>
<div className="ml-4">
<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Location</h3>
<p className="text-gray-600 dark:text-gray-400">
Servicing your local area
<br />
Online &amp; On-site
</p>
</div>
</div>
</div>

<div className="mt-8 p-6 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
Business Hours
</h3>
<div className="space-y-1 text-gray-600 dark:text-gray-400">
<p>Monday - Friday: 9:00 AM - 6:00 PM</p>
<p>Saturday: 10:00 AM - 4:00 PM</p>
<p>Sunday: Closed</p>
</div>
</div>

<div className="mt-8">
<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Follow Us</h3>
<div className="flex space-x-4">
<a
href={process.env.NEXT_PUBLIC_TWITTER_URL ?? '/contact'}
target="_blank"
rel="noopener noreferrer"
className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
>
<span className="sr-only">Twitter</span>
<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
<path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
</svg>
</a>
<a
href={process.env.NEXT_PUBLIC_FACEBOOK_URL ?? '/contact'}
target="_blank"
rel="noopener noreferrer"
className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
>
<span className="sr-only">Facebook</span>
<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
<path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
</svg>
</a>
<a
href={process.env.NEXT_PUBLIC_LINKEDIN_URL ?? '/contact'}
target="_blank"
rel="noopener noreferrer"
className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
>
<span className="sr-only">LinkedIn</span>
<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
<path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
</svg>
</a>
</div>
</div>
</div>
</div>
</div>
</div>
</Layout>
);
}
