import type { Metadata } from 'next';
import { Layout } from '@/components/layout/Layout';
import Link from 'next/link';
import { Search, MessageCircle, Book, HelpCircle, Mail, Phone } from 'lucide-react';

export const metadata: Metadata = {
	title: 'Help Center',
	description:
		'Find answers to common questions about Local Service Marketplace — guides, troubleshooting, and support resources.',
	alternates: { canonical: '/help' },
	openGraph: {
		title: 'Help Center',
		description:
			'Find answers to common questions about Local Service Marketplace — guides, troubleshooting, and support resources.',
		url: '/help',
		images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Local Service Marketplace' }],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Help Center',
		description:
			'Find answers to common questions about Local Service Marketplace — guides, troubleshooting, and support resources.',
	},
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://localservicemarketplace.com';

const helpJsonLd = {
	'@context': 'https://schema.org',
	'@type': 'WebPage',
	name: 'Help Center — Local Service Marketplace',
	url: `${SITE_URL}/help`,
	description: 'Find answers to common questions about Local Service Marketplace — guides, troubleshooting, and support resources.',
	isPartOf: { '@type': 'WebSite', name: 'Local Service Marketplace', url: SITE_URL },
};

export default function HelpPage() {
  const helpTopics = [
    {
      icon: Search,
      title: 'Getting Started',
      description: 'Learn the basics of using our platform',
      topics: [
        'How to create an account',
        'Setting up your profile',
        'Understanding user roles',
        'Navigation guide',
      ],
    },
    {
      icon: Book,
      title: 'For Customers',
      description: 'Everything you need to know about finding services',
      topics: [
        'Posting a service request',
        'Reviewing proposals',
        'Hiring a provider',
        'Making payments',
      ],
    },
    {
      icon: MessageCircle,
      title: 'For Providers',
      description: 'Grow your business on our platform',
      topics: [
        'Creating your provider profile',
        'Submitting proposals',
        'Managing bookings',
        'Getting paid',
      ],
    },
    {
      icon: HelpCircle,
      title: 'Account & Settings',
      description: 'Manage your account preferences',
      topics: [
        'Updating profile information',
        'Changing password',
        'Notification settings',
        'Privacy controls',
      ],
    },
  ];

  return (
		<Layout>
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(helpJsonLd) }} />
			<div className='bg-white dark:bg-gray-900'>
				{/* Hero Section */}
				<div className='bg-gradient-to-r from-primary-600 to-primary-800 text-white py-16'>
					<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
						<h1 className='text-4xl md:text-5xl font-bold mb-4'>Help Center</h1>
						<p className='text-xl text-primary-100 mb-8'>Find answers to your questions and get support</p>

						{/* Search Bar */}
						<div className='max-w-2xl'>
							<div className='relative'>
								<Search className='absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
								<input
									type='text'
									placeholder='Search for help...'
									className='w-full pl-12 pr-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-300'
								/>
							</div>
						</div>
					</div>
				</div>

				{/* Help Topics */}
				<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16'>
					<h2 className='text-3xl font-bold text-gray-900 dark:text-white mb-8'>Browse Help Topics</h2>

					<div className='grid md:grid-cols-2 gap-8'>
						{helpTopics.map((topic, index) => (
							<div
								key={index}
								className='bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition'>
								<div className='flex items-start mb-4'>
									<div className='flex-shrink-0'>
										<div className='flex items-center justify-center w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg'>
											<topic.icon className='w-6 h-6 text-primary-600 dark:text-primary-400' />
										</div>
									</div>
									<div className='ml-4'>
										<h3 className='text-xl font-semibold text-gray-900 dark:text-white mb-1'>{topic.title}</h3>
										<p className='text-gray-600 dark:text-gray-400 text-sm'>{topic.description}</p>
									</div>
								</div>

								<ul className='space-y-2 ml-16'>
									{topic.topics.map((item, itemIndex) => (
										<li key={itemIndex}>
											<a
												href='/contact'
												className='text-primary-600 dark:text-primary-400 hover:underline text-sm'>
												{item}
											</a>
										</li>
									))}
								</ul>
							</div>
						))}
					</div>
				</div>

				{/* Popular Articles */}
				<div className='bg-gray-50 dark:bg-gray-800 py-16'>
					<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
						<h2 className='text-3xl font-bold text-gray-900 dark:text-white mb-8'>Popular Articles</h2>

						<div className='grid md:grid-cols-2 lg:grid-cols-3 gap-6'>
							<div className='bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm'>
								<h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
									How to post your first service request
								</h3>
								<p className='text-gray-600 dark:text-gray-400 text-sm mb-4'>
									A step-by-step guide to creating your first service request
								</p>
								<a
									href='/requests/create'
									className='text-primary-600 dark:text-primary-400 hover:underline text-sm font-medium'>
									Read more →
								</a>
							</div>

							<div className='bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm'>
								<h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
									Understanding our payment system
								</h3>
								<p className='text-gray-600 dark:text-gray-400 text-sm mb-4'>Learn how payments work and stay secure</p>
								<a
									href='/contact'
									className='text-primary-600 dark:text-primary-400 hover:underline text-sm font-medium'>
									Read more →
								</a>
							</div>

							<div className='bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm'>
								<h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
									How to write a great proposal
								</h3>
								<p className='text-gray-600 dark:text-gray-400 text-sm mb-4'>
									Tips for service providers to win more jobs
								</p>
								<a
									href='/contact'
									className='text-primary-600 dark:text-primary-400 hover:underline text-sm font-medium'>
									Read more →
								</a>
							</div>

							<div className='bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm'>
								<h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>Safety tips for customers</h3>
								<p className='text-gray-600 dark:text-gray-400 text-sm mb-4'>Best practices for a safe experience</p>
								<a
									href='/contact'
									className='text-primary-600 dark:text-primary-400 hover:underline text-sm font-medium'>
									Read more →
								</a>
							</div>

							<div className='bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm'>
								<h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
									Building your provider reputation
								</h3>
								<p className='text-gray-600 dark:text-gray-400 text-sm mb-4'>How to get more reviews and ratings</p>
								<a
									href='/contact'
									className='text-primary-600 dark:text-primary-400 hover:underline text-sm font-medium'>
									Read more →
								</a>
							</div>

							<div className='bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm'>
								<h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
									Troubleshooting common issues
								</h3>
								<p className='text-gray-600 dark:text-gray-400 text-sm mb-4'>
									Solutions to frequently encountered problems
								</p>
								<a
									href='/contact'
									className='text-primary-600 dark:text-primary-400 hover:underline text-sm font-medium'>
									Read more →
								</a>
							</div>
						</div>
					</div>
				</div>

				{/* FAQ Link */}
				<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16'>
					<div className='bg-primary-50 dark:bg-primary-900/20 rounded-lg p-8 text-center'>
						<HelpCircle className='w-16 h-16 text-primary-600 dark:text-primary-400 mx-auto mb-4' />
						<h2 className='text-2xl font-bold text-gray-900 dark:text-white mb-2'>Still have questions?</h2>
						<p className='text-gray-600 dark:text-gray-300 mb-6'>
							Check out our FAQ for quick answers to common questions
						</p>
						<Link
							href='/faq'
							className='inline-block bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-semibold transition'>
							View FAQ
						</Link>
					</div>
				</div>

				{/* Contact Support */}
				<div className='bg-gray-50 dark:bg-gray-800 py-16'>
					<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
						<div className='text-center mb-8'>
							<h2 className='text-3xl font-bold text-gray-900 dark:text-white mb-4'>Need More Help?</h2>
							<p className='text-lg text-gray-600 dark:text-gray-300'>Our support team is here for you</p>
						</div>

						<div className='grid md:grid-cols-2 gap-8 max-w-2xl mx-auto'>
							<Link
								href='/contact'
								className='bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm hover:shadow-md transition text-center'>
								<div className='inline-flex items-center justify-center w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg mb-4'>
									<Mail className='w-6 h-6 text-primary-600 dark:text-primary-400' />
								</div>
								<h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>Email Support</h3>
								<p className='text-gray-600 dark:text-gray-400 text-sm'>
									Send us a message and we'll respond within 24 hours
								</p>
							</Link>

							<a
								href='tel:+1234567890'
								className='bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm hover:shadow-md transition text-center'>
								<div className='inline-flex items-center justify-center w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg mb-4'>
									<Phone className='w-6 h-6 text-primary-600 dark:text-primary-400' />
								</div>
								<h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>Phone Support</h3>
								<p className='text-gray-600 dark:text-gray-400 text-sm'>Call us Monday-Friday, 9AM-6PM EST</p>
							</a>
						</div>
					</div>
				</div>
			</div>
		</Layout>
	);
}
