'use client';

import { useState } from 'react';
import { Mail } from 'lucide-react';
import toast from 'react-hot-toast';

export function NewsletterForm() {
	const [email, setEmail] = useState('');
	const [subscribed, setSubscribed] = useState(false);

	const handleSubscribe = (e: React.FormEvent) => {
		e.preventDefault();
		if (!email.trim()) return;
		setSubscribed(true);
		toast.success("You're in! We'll keep you updated.");
		setEmail('');
		setTimeout(() => setSubscribed(false), 4000);
	};

	return (
		<form onSubmit={handleSubscribe} className='space-y-2'>
			<div className='relative'>
				<Mail className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500' />
				<input
					type='email'
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					placeholder='your@email.com'
					className='w-full pl-9 pr-3 py-2.5 text-sm border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 bg-gray-900 text-white placeholder:text-gray-600 transition-colors'
					required
				/>
			</div>
			<button
				type='submit'
				className='w-full px-4 py-2.5 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-500 rounded-xl shadow-sm transition-all duration-200'
			>
				{subscribed ? '✓ Subscribed!' : 'Subscribe'}
			</button>
		</form>
	);
}
