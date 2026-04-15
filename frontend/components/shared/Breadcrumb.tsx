import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
	label: string;
	href: string;
}

interface BreadcrumbProps {
	items: BreadcrumbItem[];
	className?: string;
}

export function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
	const allItems = [{ label: 'Home', href: '/' }, ...items];

	const breadcrumbListJsonLd = {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: allItems.map((item, index) => ({
			'@type': 'ListItem',
			position: index + 1,
			name: item.label,
			item: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://localservicemarketplace.com'}${item.href}`,
		})),
	};

	return (
		<>
			<script
				type='application/ld+json'
				dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbListJsonLd) }}
			/>
			<nav
				aria-label='Breadcrumb'
				className={`flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400 ${className}`}>
				{allItems.map((item, index) => {
					const isLast = index === allItems.length - 1;
					return (
						<span
							key={item.href}
							className='flex items-center space-x-1'>
							{index === 0 && <Home className='h-3.5 w-3.5 shrink-0' />}
							{index > 0 && <ChevronRight className='h-3.5 w-3.5 shrink-0 text-gray-300 dark:text-gray-600' />}
							{isLast ? (
								<span
									className='font-medium text-gray-700 dark:text-gray-200'
									aria-current='page'>
									{item.label}
								</span>
							) : (
								<Link
									href={item.href}
									className='hover:text-primary-600 dark:hover:text-primary-400 transition-colors'>
									{item.label}
								</Link>
							)}
						</span>
					);
				})}
			</nav>
		</>
	);
}
