import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
	const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

	const staticRoutes = [
		"",
		"/about",
		"/contact",
		"/how-it-works",
		"/providers",
		"/categories",
		"/pricing",
		"/help",
		"/faq",
		"/privacy",
		"/terms",
		"/cookies",
		"/grievance",
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
			: route === "/categories" ? 0.8
			: 0.7,
	}));
}
