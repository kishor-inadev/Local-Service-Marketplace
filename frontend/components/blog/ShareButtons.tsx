'use client';

import { useState } from 'react';
import { MessageCircle, Link2, Check, Share2 } from 'lucide-react';

interface ShareButtonsProps {
	url: string;
	title: string;
}

export function ShareButtons({ url, title }: ShareButtonsProps) {
	const [copied, setCopied] = useState(false);

	const whatsappHref = `https://wa.me/?text=${encodeURIComponent(`${title}\n${url}`)}`;
	const twitterHref = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(url);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			// Clipboard not available — silently ignore
		}
	};

	return (
		<div className='flex flex-wrap items-center gap-2'>
			<span className='inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400'>
				<Share2 className='h-3.5 w-3.5' />
				Share:
			</span>
			<a
				href={whatsappHref}
				target='_blank'
				rel='noopener noreferrer'
				aria-label='Share on WhatsApp'
				className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs font-medium hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors'>
				<MessageCircle className='h-3.5 w-3.5' />
				WhatsApp
			</a>
			<a
				href={twitterHref}
				target='_blank'
				rel='noopener noreferrer'
				aria-label='Share on X (Twitter)'
				className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400 text-xs font-medium hover:bg-sky-100 dark:hover:bg-sky-900/30 transition-colors'>
				<svg
					className='h-3.5 w-3.5'
					viewBox='0 0 24 24'
					fill='currentColor'
					aria-hidden='true'>
					<path d='M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.402 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z' />
				</svg>
				X (Twitter)
			</a>
			<button
				onClick={handleCopy}
				aria-label='Copy link to article'
				className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors'>
				{copied ? (
					<Check className='h-3.5 w-3.5 text-green-500' />
				) : (
					<Link2 className='h-3.5 w-3.5' />
				)}
				{copied ? 'Copied!' : 'Copy Link'}
			</button>
		</div>
	);
}
