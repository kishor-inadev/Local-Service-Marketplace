import type { Metadata } from 'next';
export const metadata: Metadata = {
	title: "About Us",
	description:
		"Learn about Local Service Marketplace — our mission, team, and how we connect local service providers with customers.",
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
