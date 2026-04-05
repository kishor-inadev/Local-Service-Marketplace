import type { Metadata } from 'next';
export const metadata: Metadata = {
	title: "Help Center",
	description:
		"Find answers to common questions about Local Service Marketplace — guides, troubleshooting, and support resources.",
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
