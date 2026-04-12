import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
	title: 'Sign In',
	description:
		'Sign in to your LocalService Marketplace account to manage service requests, messages, and payments.',
	robots: { index: false, follow: false },
	openGraph: {
		title: 'Sign In | LocalService Marketplace',
		description: 'Sign in to manage your account.',
		type: 'website',
	},
};

export default function LoginLayout({ children }: { children: ReactNode }) {
	return <>{children}</>;
}
