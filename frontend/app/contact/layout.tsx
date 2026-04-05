import type { Metadata } from 'next';
export const metadata: Metadata = {
	title: "Contact Us",
	description:
		"Get in touch with the Local Service Marketplace team. We are here to help with questions, feedback, and support.",
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
