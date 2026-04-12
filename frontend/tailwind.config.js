/** @type {import('tailwindcss').Config} */
module.exports = {
	content: [
		"./pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./components/**/*.{js,ts,jsx,tsx,mdx}",
		"./app/**/*.{js,ts,jsx,tsx,mdx}",
	],
	darkMode: "class",
	theme: {
		extend: {
			fontFamily: {
				sans: ["var(--font-inter)", "system-ui", "sans-serif"],
				heading: ["var(--font-jakarta)", "var(--font-inter)", "system-ui", "sans-serif"],
			},
			colors: {
				// Indigo — premium/trustworthy primary
				primary: {
					50: "#eef2ff",
					100: "#e0e7ff",
					200: "#c7d2fe",
					300: "#a5b4fc",
					400: "#818cf8",
					500: "#6366f1",
					600: "#4f46e5",
					700: "#4338ca",
					800: "#3730a3",
					900: "#312e81",
					950: "#1e1b4b",
				},
				// Emerald — success/verified/accent
				accent: {
					50: "#ecfdf5",
					100: "#d1fae5",
					200: "#a7f3d0",
					300: "#6ee7b7",
					400: "#34d399",
					500: "#10b981",
					600: "#059669",
					700: "#047857",
					800: "#065f46",
					900: "#064e3b",
				},
				// Warm slate secondary
				secondary: {
					50: "#f8fafc",
					100: "#f1f5f9",
					200: "#e2e8f0",
					300: "#cbd5e1",
					400: "#94a3b8",
					500: "#64748b",
					600: "#475569",
					700: "#334155",
					800: "#1e293b",
					900: "#0f172a",
				},
			},
			borderRadius: {
				"4xl": "2rem",
			},
			boxShadow: {
				primary: "0 4px 14px 0 rgb(99 102 241 / 0.25)",
				"primary-lg": "0 8px 30px 0 rgb(99 102 241 / 0.30)",
				soft: "0 2px 15px -3px rgb(0 0 0 / 0.07), 0 10px 20px -2px rgb(0 0 0 / 0.04)",
				card: "0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)",
				elevated: "0 10px 25px -5px rgb(0 0 0 / 0.08), 0 8px 10px -6px rgb(0 0 0 / 0.05)",
				accent: "0 4px 14px 0 rgb(16 185 129 / 0.25)",
			},
			keyframes: {
				"fade-in": {
					"0%": { opacity: "0", transform: "translateY(8px)" },
					"100%": { opacity: "1", transform: "translateY(0)" },
				},
				"slide-up": {
					"0%": { opacity: "0", transform: "translateY(20px)" },
					"100%": { opacity: "1", transform: "translateY(0)" },
				},
				"scale-in": {
					"0%": { opacity: "0", transform: "scale(0.95)" },
					"100%": { opacity: "1", transform: "scale(1)" },
				},
				float: {
					"0%, 100%": { transform: "translateY(0px)" },
					"50%": { transform: "translateY(-6px)" },
				},
				glow: {
					"0%, 100%": { opacity: "1" },
					"50%": { opacity: "0.6" },
				},
				shimmer: { "0%": { backgroundPosition: "-1000px 0" }, "100%": { backgroundPosition: "1000px 0" } },
				progress: { "0%": { width: "0%" }, "100%": { width: "100%" } },
				"pulse-soft": {
					"0%, 100%": { opacity: "1" },
					"50%": { opacity: "0.7" },
				},
			},
			animation: {
				"fade-in": "fade-in 0.4s ease-out both",
				"slide-up": "slide-up 0.5s ease-out both",
				"scale-in": "scale-in 0.3s ease-out both",
				float: "float 3s ease-in-out infinite",
				glow: "glow 2s ease-in-out infinite",
				shimmer: "shimmer 2s linear infinite",
				"pulse-soft": "pulse-soft 2s ease-in-out infinite",
			},
		},
	},
	plugins: [],
};
