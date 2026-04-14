import Link from 'next/link';
import { Layout } from '@/components/layout/Layout';
import { Breadcrumb } from '@/components/shared/Breadcrumb';
import { BLOG_POSTS } from './blog-data';
import { Clock, ChevronRight } from 'lucide-react';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://localservicemarketplace.com';

const blogListJsonLd = {
	'@context': 'https://schema.org',
	'@type': 'Blog',
	name: 'Local Service Marketplace Blog',
	description: 'Expert tips on home maintenance, hiring service providers, and getting the best value for home services in India.',
	url: `${SITE_URL}/blog`,
	blogPost: BLOG_POSTS.map((post) => ({
		'@type': 'BlogPosting',
		headline: post.title,
		description: post.excerpt,
		url: `${SITE_URL}/blog/${post.slug}`,
		datePublished: post.date,
		author: { '@type': 'Organization', name: 'Local Service Marketplace' },
	})),
};

export default function BlogPage() {
	return (
		<Layout>
			<script
				type='application/ld+json'
				dangerouslySetInnerHTML={{ __html: JSON.stringify(blogListJsonLd) }}
			/>
			<div className='bg-white dark:bg-gray-950 min-h-screen'>
				<div className='container-custom py-8 md:py-12'>
					<Breadcrumb items={[{ label: 'Blog', href: '/blog' }]} className='mb-6' />

					<div className='text-center mb-10'>
						<h1 className='text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3'>
							Home Service Tips & Guides
						</h1>
						<p className='text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto'>
							Expert advice on hiring service providers, home maintenance, and getting the best value for services across India.
						</p>
					</div>

					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
						{BLOG_POSTS.map((post) => (
							<article
								key={post.slug}
								className='flex flex-col rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow'>
								<div className='p-6 flex flex-col flex-1'>
									<span className='inline-block text-xs font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 px-2.5 py-1 rounded-full mb-3'>
										{post.category}
									</span>
									<h2 className='text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2'>
										<Link
											href={`/blog/${post.slug}`}
											className='hover:text-primary-600 dark:hover:text-primary-400 transition-colors'>
											{post.title}
										</Link>
									</h2>
									<p className='text-sm text-gray-600 dark:text-gray-400 line-clamp-3 flex-1 mb-4'>
										{post.excerpt}
									</p>
									<div className='flex items-center justify-between text-xs text-gray-500 dark:text-gray-400'>
										<div className='flex items-center gap-1'>
											<Clock className='h-3.5 w-3.5' />
											{post.readTime}
										</div>
										<time dateTime={post.date}>
											{new Date(post.date).toLocaleDateString('en-IN', {
												day: 'numeric',
												month: 'short',
												year: 'numeric',
											})}
										</time>
									</div>
									<Link
										href={`/blog/${post.slug}`}
										className='mt-4 flex items-center gap-1 text-sm font-medium text-primary-600 dark:text-primary-400 hover:gap-2 transition-all'>
										Read article <ChevronRight className='h-4 w-4' />
									</Link>
								</div>
							</article>
						))}
					</div>
				</div>
			</div>
		</Layout>
	);
}
