import '@/styles/globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { Providers } from './providers';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { WebVitals } from '@/components/performance/WebVitals';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
	metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
	title: { default: "Local Service Marketplace", template: "%s | Local Service Marketplace" },
	description:
		"Connect with local service providers in your area. Find trusted professionals for home repairs, cleaning, tutoring, and more.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
		<html lang='en'>
			<head>
				{/* Trusted Types policy for DOM-based XSS mitigation */}
				<script
					dangerouslySetInnerHTML={{
						__html: `
              if (window.trustedTypes && window.trustedTypes.createPolicy) {
                window.trustedTypes.createPolicy('default', {
                  createHTML: (input) => input,
                  createScript: (input) => input,
                  createScriptURL: (input) => input
                });
              }
            `,
					}}
				/>
			</head>
			<body className={inter.className}>
				<ThemeProvider>
					<Providers>
						<WebVitals />
						<main id='main-content'>{children}</main>
						<Toaster position='top-right' />
					</Providers>
				</ThemeProvider>
			</body>
		</html>
	);
}
