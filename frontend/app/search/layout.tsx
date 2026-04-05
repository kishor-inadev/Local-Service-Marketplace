import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: "Search",
	description: "Search for service providers, requests, and categories across the marketplace",
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
