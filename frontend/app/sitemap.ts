import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
	const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

	const staticRoutes = [
		"",
		"/about",
		"/contact",
		"/how-it-works",
		"/providers",
		"/pricing",
		"/help",
		"/faq",
		"/privacy",
		"/terms",
		"/cookies",
		"/careers",
		"/search",
		"/login",
		"/signup",
	];

	return staticRoutes.map((route) => ({
		url: `${siteUrl}${route}`,
		lastModified: new Date(),
		changeFrequency: route === "" ? "daily" : ("weekly" as const),
		priority:
			route === "" ? 1
			: route === "/providers" || route === "/search" ? 0.9
			: 0.7,
	}));
}
