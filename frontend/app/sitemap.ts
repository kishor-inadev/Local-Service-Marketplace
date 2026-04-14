import { MetadataRoute } from "next";
import { INDIA_CITIES, SERVICE_SLUGS } from "@/config/seo-data";

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
		"/cities",
		"/blog",
	];

	const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
		url: `${siteUrl}${route}`,
		lastModified: new Date(),
		changeFrequency: route === "" ? "daily" : ("weekly" as const),
		priority:
			route === "" ? 1
			: route === "/providers" || route === "/search" ? 0.9
			: route === "/categories" || route === "/cities" ? 0.8
			: 0.7,
	}));

	// 700 city×service landing pages
	const cityServiceEntries: MetadataRoute.Sitemap = [];
	for (const service of SERVICE_SLUGS) {
		for (const city of INDIA_CITIES) {
			cityServiceEntries.push({
				url: `${siteUrl}/services/${service.slug}/${city.slug}`,
				lastModified: new Date(),
				changeFrequency: "weekly" as const,
				priority: 0.75,
			});
		}
	}

	// /cities/:slug hub pages
	const cityHubEntries: MetadataRoute.Sitemap = INDIA_CITIES.map((city) => ({
		url: `${siteUrl}/cities/${city.slug}`,
		lastModified: new Date(),
		changeFrequency: "weekly" as const,
		priority: 0.7,
	}));

	return [...staticEntries, ...cityServiceEntries, ...cityHubEntries];
}

