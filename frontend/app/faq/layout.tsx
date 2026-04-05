import type { Metadata } from 'next';
export const metadata: Metadata = {
	title: "FAQ",
	description:
		"Frequently asked questions about Local Service Marketplace — answers about accounts, services, payments, and more.",
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
