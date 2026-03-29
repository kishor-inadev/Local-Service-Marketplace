/** @type {import('next').NextConfig} */
const nextConfig = {
	// Use standalone output only for Docker builds
	...(process.env.DOCKER_BUILD === "true" ? { output: "standalone" } : {}),
	reactStrictMode: true,

	// Environment variables
	env: { NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3700" },

	// Image optimization
	images: {
		remotePatterns: [
			{ protocol: "https", hostname: "**.cloudinary.com" },
			{ protocol: "https", hostname: "**.amazonaws.com" },
			{ protocol: "http", hostname: "localhost" },
		],
		formats: ["image/avif", "image/webp"],
		deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
		imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
	},

	// Security headers
	async headers() {
		return [
			{
				source: "/:path*",
				headers: [
					{ key: "X-DNS-Prefetch-Control", value: "on" },
					{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
					{ key: "X-Frame-Options", value: "SAMEORIGIN" },
					{ key: "X-Content-Type-Options", value: "nosniff" },
					{ key: "X-XSS-Protection", value: "1; mode=block" },
					{ key: "Referrer-Policy", value: "origin-when-cross-origin" },
					{ key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
				],
			},
		];
	},

	// API rewrites
	async rewrites() {
		const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3700";
		return [{ source: "/api/v1/:path*", destination: `${apiUrl}/api/v1/:path*` }];
	},

	// Webpack optimization
	webpack: (config, { isServer, dev }) => {
		if (!isServer) {
			config.resolve.fallback = { ...config.resolve.fallback, fs: false, net: false, tls: false };
		}
		// Enable polling for file watching on Windows (fixes HMR not reflecting changes)
		if (dev) {
			config.watchOptions = { poll: 1000, aggregateTimeout: 300 };
		}
		return config;
	},
};

module.exports = nextConfig;
