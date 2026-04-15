import type { Metadata } from 'next';
import { BLOG_POSTS } from '../blog-data';

interface Props {
	params: { slug: string };
}

export function generateStaticParams() {
	return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const post = BLOG_POSTS.find((p) => p.slug === params.slug);
	if (!post) return { title: 'Blog | Local Service Marketplace' };

	const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://localservicemarketplace.com';
	const url = `/blog/${post.slug}`;

	return {
		title: `${post.title} | Local Service Marketplace Blog`,
		description: post.excerpt,
		keywords: post.keywords,
		alternates: { canonical: url },
		openGraph: {
			title: post.title,
			description: post.excerpt,
			url,
			type: 'article',
			locale: 'en_IN',
			publishedTime: post.date,
			modifiedTime: post.dateModified || post.date,
			authors: ['Local Service Marketplace'],
			images: [{ url: `${siteUrl}/opengraph-image`, width: 1200, height: 630, alt: post.title }],
		},
		twitter: {
			card: 'summary_large_image',
			title: post.title,
			description: post.excerpt,
			images: [`${siteUrl}/opengraph-image`],
		},
	};
}

export default function BlogPostLayout({ children }: { children: React.ReactNode }) {
	return children;
}
