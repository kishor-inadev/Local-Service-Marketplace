import type { Metadata } from "next";
import "@/styles/globals.css";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";

import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const jakartaSans = Plus_Jakarta_Sans({
	subsets: ["latin"],
	variable: "--font-jakarta",
	display: "swap",
	weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
	title: {
		default: "Local Service Marketplace | Find Trusted Local Providers",
		template: "%s | Local Service Marketplace",
	},
	description:
		"Connect with verified, licensed professionals in your neighborhood. Post your request free, get multiple quotes, and hire with confidence.",
	metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://localservicemarketplace.com"),
	openGraph: {
		type: "website",
		siteName: "Local Service Marketplace",
		images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Local Service Marketplace" }],
	},
	twitter: { card: "summary_large_image", images: ["/opengraph-image"] },
	robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html
			lang='en'
			className={`${inter.variable} ${jakartaSans.variable}`}>
			<head>
				<link rel="preconnect" href={process.env.NEXT_PUBLIC_API_URL || "http://localhost:3700"} />
				<link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_API_URL || "http://localhost:3700"} />
			</head>
			<body className='font-sans antialiased'>
				<Providers>
					<main id='main-content'>{children}</main>
				</Providers>
			</body>
		</html>
	);
}
