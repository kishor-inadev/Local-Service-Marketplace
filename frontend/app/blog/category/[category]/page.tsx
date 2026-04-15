import { notFound } from 'next/navigation';
import Link from 'next/link';
import { type Metadata } from 'next';
import { Layout } from '@/components/layout/Layout';
import { Breadcrumb } from '@/components/shared/Breadcrumb';
import { BLOG_POSTS, BLOG_CATEGORIES, categoryToSlug } from '../../blog-data';
import { Clock, ChevronRight } from 'lucide-react';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://localservicemarketplace.com';

export function generateStaticParams() {
	return BLOG_CATEGORIES.map((cat) => ({ category: categoryToSlug(cat) }));
}

export async function generateMetadata({
	params,
}: {
	params: { category: string };
}): Promise<Metadata> {
	const category = BLOG_CATEGORIES.find((c) => categoryToSlug(c) === params.category);
	if (!category) return {};

	const title = `${category} | Local Service Marketplace Blog`;
	const description = `Browse all ${category} articles — expert home service tips, guides and advice for Indian homeowners.`;
	const url = `${SITE_URL}/blog/category/${params.category}`;

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
			images: [{ url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630, alt: title }],
		},
		twitter: { card: 'summary_large_image', title, description, images: [`${SITE_URL}/opengraph-image`] },
	};
}

export default function BlogCategoryPage({ params }: { params: { category: string } }) {
	const category = BLOG_CATEGORIES.find((c) => categoryToSlug(c) === params.category);
	if (!category) notFound();

	const posts = BLOG_POSTS.filter((p) => categoryToSlug(p.category) === params.category);

	const jsonLd = {
		'@context': 'https://schema.org',
		'@type': 'CollectionPage',
		name: `${category} — Local Service Marketplace Blog`,
		description: `All ${category} articles on home services in India`,
		url: `${SITE_URL}/blog/category/${params.category}`,
		breadcrumb: {
			'@type': 'BreadcrumbList',
			itemListElement: [
				{ '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
				{ '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
				{ '@type': 'ListItem', position: 3, name: category, item: `${SITE_URL}/blog/category/${params.category}` },
			],
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
							{ label: 'Blog', href: '/blog' },
							{ label: category, href: `/blog/category/${params.category}` },
						]}
						className='mb-6'
					/>

					<div className='text-center mb-10'>
						<span className='inline-block text-xs font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 px-2.5 py-1 rounded-full mb-3'>
							Category
						</span>
						<h1 className='text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2'>
							{category}
						</h1>
						<p className='text-gray-500 dark:text-gray-400'>
							{posts.length} article{posts.length !== 1 ? 's' : ''}
						</p>
					</div>

					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12'>
						{posts.map((post) => (
							<article
								key={post.slug}
								className='flex flex-col rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow'>
								<div className='p-6 flex flex-col flex-1'>
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
									<div className='flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-4'>
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
										className='flex items-center gap-1 text-sm font-medium text-primary-600 dark:text-primary-400 hover:gap-2 transition-all'>
										Read article <ChevronRight className='h-4 w-4' />
									</Link>
								</div>
							</article>
						))}
					</div>

					{/* Other categories */}
					<div className='pt-8 border-t border-gray-200 dark:border-gray-700'>
						<h2 className='text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4'>
							Browse Other Categories
						</h2>
						<div className='flex flex-wrap gap-2'>
							{BLOG_CATEGORIES.filter((c) => c !== category).map((c) => (
								<Link
									key={c}
									href={`/blog/category/${categoryToSlug(c)}`}
									className='inline-flex items-center px-4 py-2 rounded-full text-sm text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-primary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors'>
									{c}
								</Link>
							))}
						</div>
					</div>
				</div>
			</div>
		</Layout>
	);
}
