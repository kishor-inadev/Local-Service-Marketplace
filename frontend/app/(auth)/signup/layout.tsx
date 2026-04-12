import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
	title: 'Create Account',
	description:
		'Join LocalService Marketplace — post service requests, connect with verified local professionals, and manage your home services in one place.',
	openGraph: {
		title: 'Create Account | LocalService Marketplace',
		description: 'Join thousands of customers and trusted providers. Free to sign up, no subscription required.',
		type: 'website',
	},
};

export default function SignupLayout({ children }: { children: ReactNode }) {
	return <>{children}</>;
}
