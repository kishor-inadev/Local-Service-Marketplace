import { Layout } from "@/components/layout/Layout";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { HeroSearch } from "@/components/layout/HeroSearch";
import {
	ShieldCheck,
	Lock,
	Star,
	Headphones,
	MapPin,
	ShieldIcon,
	UserCheck,
	BadgeCheck,
	RefreshCw,
	Clock,
	Trophy,
	CreditCard,
	Zap,
	Check,
} from "lucide-react";
import { Metadata } from "next";

// Advanced SEO metadata for homepage
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://localservicemarketplace.com";

export const metadata: Metadata = {
	title: "Local Service Marketplace | Find Trusted Local Providers",
	description:
		"Connect with verified, licensed professionals in your neighborhood. Post your request free, get multiple quotes, and hire with confidence.",
	openGraph: {
		title: "Local Service Marketplace",
		description:
			"Connect with verified, licensed professionals in your neighborhood. Post your request free, get multiple quotes, and hire with confidence.",
		url: SITE_URL,
		siteName: "Local Service Marketplace",
		images: [
			{ url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630, alt: "Local Service Marketplace" },
		],
		locale: "en_US",
		type: "website",
	},
	twitter: {
		card: "summary_large_image",
		title: "Local Service Marketplace",
		description: "Connect with verified, licensed professionals in your neighborhood.",
		images: [`${SITE_URL}/opengraph-image`],
	},
	alternates: { canonical: SITE_URL },
};

const serviceCategories = [
	{
		name: "Home Cleaning",
		icon: "🏠",
		description: "Professional cleaning services",
		jobs: "2.5K+ completed",
		color: "bg-sky-50 dark:bg-sky-900/20",
	},
	{
		name: "Plumbing",
		icon: "🔧",
		description: "Licensed plumbers",
		jobs: "3.2K+ completed",
		color: "bg-blue-50 dark:bg-blue-900/20",
	},
	{
		name: "Electrical",
		icon: "💡",
		description: "Certified electricians",
		jobs: "1.8K+ completed",
		color: "bg-yellow-50 dark:bg-yellow-900/20",
	},
	{
		name: "Landscaping",
		icon: "🌿",
		description: "Garden & lawn care",
		jobs: "2.1K+ completed",
		color: "bg-green-50 dark:bg-green-900/20",
	},
	{
		name: "Moving",
		icon: "📦",
		description: "Reliable movers",
		jobs: "1.5K+ completed",
		color: "bg-orange-50 dark:bg-orange-900/20",
	},
	{
		name: "Painting",
		icon: "🎨",
		description: "Interior & exterior",
		jobs: "1.3K+ completed",
		color: "bg-pink-50 dark:bg-pink-900/20",
	},
	{
		name: "HVAC",
		icon: "❄️",
		description: "Heating & cooling",
		jobs: "900+ completed",
		color: "bg-cyan-50 dark:bg-cyan-900/20",
	},
	{
		name: "Carpentry",
		icon: "🔨",
		description: "Custom woodwork",
		jobs: "850+ completed",
		color: "bg-amber-50 dark:bg-amber-900/20",
	},
	{
		name: "Appliance Repair",
		icon: "🔧",
		description: "Fix all appliances",
		jobs: "1.1K+ completed",
		color: "bg-indigo-50 dark:bg-indigo-900/20",
	},
	{
		name: "Roofing",
		icon: "🏘️",
		description: "Roof repair & install",
		jobs: "650+ completed",
		color: "bg-stone-50 dark:bg-stone-900/20",
	},
	{
		name: "Flooring",
		icon: "📐",
		description: "All flooring types",
		jobs: "720+ completed",
		color: "bg-teal-50 dark:bg-teal-900/20",
	},
	{
		name: "Pest Control",
		icon: "🐛",
		description: "Exterminators",
		jobs: "980+ completed",
		color: "bg-lime-50 dark:bg-lime-900/20",
	},
];

const features: Array<{
	title: string;
	description: string;
	Icon: React.ElementType;
	iconBg: string;
	iconColor: string;
}> = [
	{
		title: "Verified Providers",
		description:
			"All service providers undergo background checks, license verification, and identity confirmation for your safety.",
		Icon: ShieldCheck,
		iconBg: "bg-green-100 dark:bg-green-900/40",
		iconColor: "text-green-600 dark:text-green-400",
	},
	{
		title: "Secure Payments",
		description:
			"Pay securely through our escrow system with buyer protection, refund guarantees, and fraud prevention.",
		Icon: Lock,
		iconBg: "bg-primary-100 dark:bg-primary-900/40",
		iconColor: "text-primary-600 dark:text-primary-400",
	},
	{
		title: "Real Reviews",
		description: "Read authentic reviews from verified customers. Only real job completions can leave feedback.",
		Icon: Star,
		iconBg: "bg-yellow-100 dark:bg-yellow-900/40",
		iconColor: "text-yellow-600 dark:text-yellow-400",
	},
	{
		title: "24/7 Support",
		description: "Our dedicated customer support team is available around the clock to resolve any concerns.",
		Icon: Headphones,
		iconBg: "bg-purple-100 dark:bg-purple-900/40",
		iconColor: "text-purple-600 dark:text-purple-400",
	},
	{
		title: "Local Experts",
		description: "Connect with professionals in your neighborhood who understand local requirements and codes.",
		Icon: MapPin,
		iconBg: "bg-red-100 dark:bg-red-900/40",
		iconColor: "text-red-600 dark:text-red-400",
	},
	{
		title: "Insurance Protected",
		description: "All providers carry liability insurance. Jobs are covered by our platform protection guarantee.",
		Icon: ShieldIcon,
		iconBg: "bg-primary-100 dark:bg-primary-900/40",
		iconColor: "text-primary-600 dark:text-primary-400",
	},
];

const stats = [
	{ value: "15K+", label: "Active Providers" },
	{ value: "87K+", label: "Jobs Completed" },
	{ value: "4.9/5", label: "Average Rating" },
	{ value: "150+", label: "Service Categories" },
];

const howItWorksCustomer = [
	{
		step: "1",
		title: "Describe Your Project",
		description:
			"Tell us what you need done. Include photos, budget, timeline, and any special requirements. Get instant matches with qualified providers.",
		image: "📝",
	},
	{
		step: "2",
		title: "Compare & Chat",
		description:
			"Receive proposals within hours. Review provider profiles, ratings, portfolios, and pricing. Ask questions through our secure messaging.",
		image: "💬",
	},
	{
		step: "3",
		title: "Hire with Confidence",
		description:
			"Choose your provider and set milestones. Track progress, communicate in real-time, and release payment when satisfied.",
		image: "✅",
	},
];

const howItWorksProvider = [
	{
		step: "1",
		title: "Create Your Profile",
		description:
			"Set up your professional profile with services, service areas, portfolio, certifications, and pricing.",
		image: "👤",
	},
	{
		step: "2",
		title: "Find Jobs",
		description:
			"Browse requests in your area or get matched automatically. Submit competitive proposals with your timeline and pricing.",
		image: "🔍",
	},
	{
		step: "3",
		title: "Get Paid Securely",
		description:
			"Complete the job, request payment, and receive funds within 1-2 business days via your preferred method.",
		image: "💰",
	},
];

const trustIndicators: Array<{ label: string; Icon: React.ElementType }> = [
	{ label: "Background Checked", Icon: UserCheck },
	{ label: "Licensed & Insured", Icon: BadgeCheck },
	{ label: "Verified Reviews", Icon: Star },
	{ label: "Money-Back Guarantee", Icon: RefreshCw },
	{ label: "Secure Payments", Icon: Lock },
	{ label: "24/7 Support", Icon: Clock },
];

const faqs = [
	{
		question: "How much does it cost to post a request?",
		answer:
			"Posting requests is completely free! You only pay when you hire a provider and the job is completed to your satisfaction.",
	},
	{
		question: "How are providers verified?",
		answer:
			"All providers undergo background checks, license verification, insurance confirmation, and identity validation before joining our platform.",
	},
	{
		question: "What if I'm not satisfied with the work?",
		answer:
			"We offer a satisfaction guarantee. If work doesn't meet agreed standards, we offer mediation, refunds, or free rework through our dispute resolution.",
	},
	{
		question: "How long does it take to get proposals?",
		answer: "Most requests receive 3-5 proposals within 24 hours. Urgent requests can get responses within 1-2 hours.",
	},
	{
		question: "Is my payment secure?",
		answer:
			"Yes! Payments are held in escrow and only released when you approve completed work. We use bank-level encryption for all transactions.",
	},
	{
		question: "Can I message providers before hiring?",
		answer:
			"Absolutely! Our secure messaging lets you discuss details, ask questions, and clarify requirements before making a decision.",
	},
];

export default function HomePage() {
	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "WebSite",
		name: "Local Service Marketplace",
		url: SITE_URL,
		description:
			"Connect with verified, licensed professionals in your neighborhood. Post your request free, get multiple quotes, and hire with confidence.",
		potentialAction: {
			"@type": "SearchAction",
			target: `${SITE_URL}/search?q={search_term_string}`,
			"query-input": "required name=search_term_string",
		},
	};

	const orgJsonLd = {
		"@context": "https://schema.org",
		"@type": "Organization",
		name: "Local Service Marketplace",
		url: SITE_URL,
		logo: `${SITE_URL}/logo.png`,
		sameAs: [],
		contactPoint: { "@type": "ContactPoint", contactType: "customer service", availableLanguage: "English" },
	};

	const localBusinessJsonLd = {
		"@context": "https://schema.org",
		"@type": "LocalBusiness",
		name: "Local Service Marketplace",
		description:
			"India's trusted platform to find verified local service providers — plumbers, electricians, cleaners, carpenters and more.",
		url: SITE_URL,
		logo: `${SITE_URL}/logo.png`,
		image: `${SITE_URL}/opengraph-image`,
		telephone: "+91-1800-XXX-XXXX",
		email: "support@localservicemarketplace.com",
		address: {
			"@type": "PostalAddress",
			addressCountry: "IN",
			addressRegion: "Maharashtra",
			addressLocality: "Mumbai",
		},
		areaServed: [
			"Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Chennai",
			"Kolkata", "Pune", "Ahmedabad", "Jaipur", "Surat",
		],
		priceRange: "₹₹",
		openingHours: "Mo-Su 00:00-24:00",
		aggregateRating: {
			"@type": "AggregateRating",
			ratingValue: "4.9",
			bestRating: "5",
			ratingCount: "87000",
		},
	};

	return (
		<Layout>
			<script
				type='application/ld+json'
				dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
			/>
			<script
				type='application/ld+json'
				dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
			/>
			<script
				type='application/ld+json'
				dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
			/>
			<div className='bg-white dark:bg-gray-950'>
				{/* Hero Section */}
				<div className='relative isolate overflow-hidden hero-gradient bg-white dark:bg-gray-950'>
					<div className='absolute inset-0 -z-10 overflow-hidden'>
						{/* Decorative glow */}
						<div className='absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary-300/15 dark:bg-primary-500/8 blur-3xl rounded-full pointer-events-none' />
						<svg
							className='absolute left-[max(50%,25rem)] top-0 h-[64rem] w-[128rem] -translate-x-1/2 stroke-gray-200/60 dark:stroke-gray-700/40 [mask-image:radial-gradient(64rem_64rem_at_top,white,transparent)]'
							aria-hidden='true'>
							<defs>
								<pattern
									id='pattern'
									width={200}
									height={200}
									x='50%'
									y={-1}
									patternUnits='userSpaceOnUse'>
									<path
										d='M.5 200V.5H200'
										fill='none'
									/>
								</pattern>
							</defs>
							<svg
								x='50%'
								y={-1}
								className='overflow-visible fill-gray-50/80 dark:fill-gray-900'>
								<path
									d='M-200 0h201v201h-201Z M600 0h201v201h-201Z M-400 600h201v201h-201Z M200 800h201v201h-201Z'
									strokeWidth={0}
								/>
							</svg>
							<rect
								width='100%'
								height='100%'
								strokeWidth={0}
								fill='url(#pattern)'
							/>
						</svg>
					</div>

					<div className='mx-auto max-w-7xl px-6 py-24 sm:py-36 lg:px-8'>
						<div className='mx-auto max-w-4xl text-center'>
							{/* Trust Badge */}
							<div className='mb-8 flex justify-center'>
								<div className='relative rounded-full px-4 py-2 text-sm leading-6 text-gray-600 dark:text-gray-300 ring-1 ring-gray-900/10 dark:ring-gray-100/10 hover:ring-gray-900/20 dark:hover:ring-gray-100/20 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-sm flex items-center gap-1.5'>
									<Star className='h-4 w-4 text-yellow-400 fill-yellow-400' />
									Rated 4.9/5 by 50,000+ customers • Trusted since 2020
								</div>
							</div>

							<h1 className='font-heading text-5xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-7xl leading-tight'>
								Your <span className='gradient-text'>Local Service</span><br />
								Marketplace
							</h1>
							<p className='mt-6 text-xl leading-8 text-gray-600 dark:text-gray-400 max-w-3xl mx-auto'>
								Connect with verified, licensed professionals in your neighborhood. From home repairs to lawn care, find
								trusted experts for any job. Post your request free, get multiple quotes, and hire with confidence.
							</p>

							<div className='mt-10 flex flex-col sm:flex-row items-center justify-center gap-3'>
								<Link href='/signup'>
									<Button
										size='lg'
										className='font-semibold px-8 py-3.5 w-full sm:w-auto shadow-primary hover:shadow-primary-lg'>
										Get Started Free →
									</Button>
								</Link>
								<Link href='/requests/create'>
									<Button
										variant='outline'
										size='lg'
										className='font-semibold px-8 py-3.5 w-full sm:w-auto'>
										Post a Job Request
									</Button>
								</Link>
							</div>

							{/* Search Bar */}
							<HeroSearch />

							{/* Trust Indicators */}
							<div className='mt-12 flex flex-wrap justify-center gap-5 text-sm text-gray-500 dark:text-gray-400'>
								{trustIndicators.map(({ label, Icon }) => (
									<div
										key={label}
										className='flex items-center gap-1.5'>
										<Icon className='h-4 w-4 text-primary-500' />
										<span>{label}</span>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>

				{/* Stats Section */}
				<div className='bg-gradient-to-r from-primary-600 via-primary-600 to-violet-700 py-16 shadow-xl'>
					<div className='mx-auto max-w-7xl px-6 lg:px-8'>
						<div className='grid grid-cols-2 gap-8 md:grid-cols-4'>
							{stats.map((stat) => (
								<div
									key={stat.label}
									className='text-center group cursor-pointer'>
									<div className='text-4xl md:text-5xl font-bold text-white group-hover:scale-110 transition-transform'>
										{stat.value}
									</div>
									<div className='mt-2 text-sm md:text-base text-primary-100'>{stat.label}</div>
								</div>
							))}
						</div>
						<div className='mt-10 text-center'>
							<p className='text-primary-100 text-sm'>
								🎉 1,000+ jobs completed this week • 500+ new providers joined this month
							</p>
						</div>
					</div>
				</div>

				{/* Service Categories Section */}
				<div className='mx-auto max-w-7xl px-6 py-24 lg:px-8'>
					<div className='mx-auto max-w-3xl text-center'>
						<h2 className='text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100'>
							Popular Service Categories
						</h2>
						<p className='mt-4 text-lg text-gray-500 dark:text-gray-400'>
							Explore our most requested services or browse over 150+ categories
						</p>
					</div>
					<div className='mx-auto mt-16 grid max-w-6xl grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4'>
						{serviceCategories.map((category) => (
							<Link
								key={category.name}
								href={`/requests/create?q=${encodeURIComponent(category.name)}`}>
								<Card
									hover
									className='cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 h-full group'>
									<CardContent className='flex flex-col items-center text-center p-6'>
										<div
											className={`h-14 w-14 rounded-2xl ${category.color} flex items-center justify-center text-3xl mb-4 transition-transform group-hover:scale-110`}>
											{category.icon}
										</div>
										<h3 className='font-semibold text-gray-900 dark:text-gray-100 text-sm'>{category.name}</h3>
										<p className='mt-1 text-xs text-gray-400 dark:text-gray-500'>{category.description}</p>
										<p className='mt-2.5 text-xs font-semibold text-primary-600 dark:text-primary-400'>{category.jobs}</p>
									</CardContent>
								</Card>
							</Link>
						))}
					</div>
					<div className='mt-12 text-center'>
						<Link href='/requests/create'>
							<Button
								variant='outline'
								size='lg'
								className='text-sm px-8'>
								View All 150+ Categories →
							</Button>
						</Link>
					</div>
				</div>

				{/* How It Works Section */}
				<div className='bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 py-24'>
					<div className='mx-auto max-w-7xl px-6 lg:px-8'>
						<div className='mx-auto max-w-3xl text-center'>
							<h2 className='font-heading text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100'>How It Works</h2>
							<p className='mt-4 text-lg text-gray-600 dark:text-gray-400'>
								Simple, transparent, and secure process for customers and providers
							</p>
						</div>

						{/* For Customers */}
						<div className='mt-16'>
							<div className='text-center mb-12'>
								<h3 className='text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2'>For Customers</h3>
								<p className='text-gray-600 dark:text-gray-400'>Get your project done in three easy steps</p>
							</div>
							<div className='mx-auto max-w-6xl'>
								<div className='grid gap-8 lg:grid-cols-3'>
									{howItWorksCustomer.map((item) => (
										<div
											key={item.step}
											className='relative'>
											<div className='flex flex-col items-center text-center'>
												<div className='flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-violet-600 text-white text-4xl font-bold shadow-xl mb-2'>
													{item.image}
												</div>
												<div className='absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-white text-sm font-bold shadow-lg'>
													{item.step}
												</div>
												<h3 className='mt-6 text-xl font-semibold text-gray-900 dark:text-gray-100'>{item.title}</h3>
												<p className='mt-4 text-gray-600 dark:text-gray-400 text-base leading-relaxed'>
													{item.description}
												</p>
											</div>
										</div>
									))}
								</div>
							</div>
						</div>

						{/* For Providers */}
						<div className='mt-24 pt-12 border-t-2 border-gray-200 dark:border-gray-700'>
							<div className='text-center mb-12'>
								<h3 className='text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2'>For Service Providers</h3>
								<p className='text-gray-600 dark:text-gray-400'>Start growing your business today</p>
							</div>
							<div className='mx-auto max-w-6xl'>
								<div className='grid gap-8 lg:grid-cols-3'>
									{howItWorksProvider.map((item) => (
										<div
											key={item.step}
											className='relative'>
											<div className='flex flex-col items-center text-center'>
												<div className='flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-500 to-accent-600 text-white text-4xl font-bold shadow-xl mb-2'>
													{item.image}
												</div>
												<div className='absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-accent-600 text-white text-sm font-bold shadow-lg'>
													{item.step}
												</div>
												<h3 className='mt-6 text-xl font-semibold text-gray-900 dark:text-gray-100'>{item.title}</h3>
												<p className='mt-4 text-gray-600 dark:text-gray-400 text-base leading-relaxed'>
													{item.description}
												</p>
											</div>
										</div>
									))}
								</div>
							</div>
						</div>

						{/* CTA to Learn More */}
						<div className='mt-16 text-center'>
							<Link href='/how-it-works'>
								<Button
									variant='outline'
									size='lg'
									className='text-lg px-8'>
									Learn More About Our Process →
								</Button>
							</Link>
						</div>
					</div>
				</div>

				{/* Features Section */}
				<div className='mx-auto max-w-7xl px-6 py-24 lg:px-8 bg-white dark:bg-gray-950'>
					<div className='mx-auto max-w-3xl text-center'>
						<h2 className='text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100'>
							Why Thousands Choose Us
						</h2>
						<p className='mt-4 text-lg text-gray-600 dark:text-gray-400'>
							The safest, easiest way to hire local service professionals
						</p>
					</div>
					<div className='mx-auto mt-16 grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-3'>
						{features.map((feature) => (
							<Card
								key={feature.title}
								hover
								className='transition-all hover:shadow-lg hover:-translate-y-1'>
								<CardContent className='p-8'>
									<div className='flex flex-col'>
										<div className={`flex h-12 w-12 items-center justify-center rounded-xl ${feature.iconBg} mb-5`}>
											<feature.Icon className={`h-6 w-6 ${feature.iconColor}`} />
										</div>
										<h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2'>{feature.title}</h3>
										<p className='text-sm text-gray-500 dark:text-gray-400 leading-relaxed'>{feature.description}</p>
									</div>
								</CardContent>
							</Card>
						))}
					</div>

					{/* Additional Trust Signals */}
					<div className='mt-20 bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 rounded-3xl p-12 dark:border dark:border-gray-700'>
						<div className='grid md:grid-cols-3 gap-8 text-center'>
							<div>
								<div className='h-16 w-16 rounded-2xl bg-yellow-100 dark:bg-yellow-900/40 flex items-center justify-center mx-auto mb-4'>
									<Trophy className='h-8 w-8 text-yellow-600 dark:text-yellow-400' />
								</div>
								<h4 className='font-bold text-gray-900 dark:text-gray-100 text-lg mb-2'>Award Winning</h4>
								<p className='text-gray-600 dark:text-gray-400'>Best Local Service Platform 2025</p>
							</div>
							<div>
								<div className='h-16 w-16 rounded-2xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center mx-auto mb-4'>
									<CreditCard className='h-8 w-8 text-blue-600 dark:text-blue-400' />
								</div>
								<h4 className='font-bold text-gray-900 dark:text-gray-100 text-lg mb-2'>Escrow Protection</h4>
								<p className='text-gray-600 dark:text-gray-400'>Your money held safely until job completion</p>
							</div>
							<div>
								<div className='h-16 w-16 rounded-2xl bg-green-100 dark:bg-green-900/40 flex items-center justify-center mx-auto mb-4'>
									<Zap className='h-8 w-8 text-green-600 dark:text-green-400' />
								</div>
								<h4 className='font-bold text-gray-900 dark:text-gray-100 text-lg mb-2'>Fast Matching</h4>
								<p className='text-gray-600 dark:text-gray-400'>Get quotes within hours, not days</p>
							</div>
						</div>
					</div>
				</div>

				{/* Provider CTA Section */}
				<div className='bg-gradient-to-br from-primary-900 via-primary-800 to-violet-900 relative overflow-hidden'>
					<div className='absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,119,198,0.15),transparent)]' />
					<div className='mx-auto max-w-7xl px-6 py-24 lg:px-8 relative'>
						<div className='mx-auto max-w-4xl text-center'>
							<div className='inline-flex items-center rounded-full bg-white/10 px-5 py-1.5 mb-6 ring-1 ring-white/20'>
								<span className='text-white/90 text-sm font-medium'>💼 For Service Professionals</span>
							</div>
							<h2 className='font-heading text-4xl md:text-5xl font-bold text-white'>Grow Your Local Business</h2>
							<p className='mt-6 text-lg text-primary-100 leading-relaxed max-w-2xl mx-auto'>
								Join 15,000+ trusted professionals earning more with our platform. Get matched with ready-to-hire
								customers in your area. Set your own rates, choose your jobs, and get paid fast.
							</p>
							<div className='mt-10 flex flex-col sm:flex-row items-center justify-center gap-3'>
								<Link href='/signup'>
									<Button
										size='lg'
										className='bg-white dark:bg-white text-primary-700 dark:text-primary-700 hover:bg-gray-100 dark:hover:bg-gray-100 font-semibold text-lg px-10 py-6 w-full sm:w-auto shadow-xl shadow-black/20'>
										Join as Provider →
									</Button>
								</Link>
								<Link href='/login'>
									<Button
										variant='outline'
										size='lg'
										className='border-2 border-white dark:border-white bg-transparent dark:bg-transparent text-white dark:text-white hover:bg-white/10 dark:hover:bg-white/10 hover:border-white dark:hover:border-white font-semibold text-lg px-10 py-6 w-full sm:w-auto'>
										Provider Login
									</Button>
								</Link>
							</div>

							{/* Provider Benefits */}
							<div className='mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6'>
								<div className='bg-white/10 rounded-xl p-6 border border-white/15'>
									<div className='text-4xl font-bold text-white mb-1'>₹0</div>
									<div className='text-sm font-semibold text-primary-100 mb-1'>To Join</div>
									<div className='text-xs text-primary-200/70'>No subscription fees or upfront costs</div>
								</div>
								<div className='bg-white/10 rounded-xl p-6 border border-white/15'>
									<div className='text-4xl font-bold text-white mb-1'>95%</div>
									<div className='text-sm font-semibold text-primary-100 mb-1'>You Keep</div>
									<div className='text-xs text-primary-200/70'>Industry-low 5% service fee</div>
								</div>
								<div className='bg-white/10 rounded-xl p-6 border border-white/15'>
									<div className='text-4xl font-bold text-white mb-1'>1-2</div>
									<div className='text-sm font-semibold text-primary-100 mb-1'>Day Payout</div>
									<div className='text-xs text-primary-200/70'>Fast, secure payment transfers</div>
								</div>
							</div>

							{/* Additional Provider Benefits */}
							<div className='mt-12 flex flex-wrap justify-center gap-6'>
								{["Build Your Brand", "Verified Reviews", "Marketing Tools", "Calendar Management", "Mobile App"].map(
									(benefit) => (
										<div
											key={benefit}
											className='flex items-center gap-2'>
											<Check className='h-4 w-4 text-accent-400' />
											<span className='text-sm text-primary-100'>{benefit}</span>
										</div>
									),
								)}
							</div>
						</div>
					</div>
				</div>

				{/* Testimonials Section */}
				<div className='mx-auto max-w-7xl px-6 py-24 lg:px-8 bg-white dark:bg-gray-950'>
					<div className='mx-auto max-w-3xl text-center'>
						<h2 className='text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100'>
							Loved by Customers & Professionals
						</h2>
						<p className='mt-4 text-lg text-gray-600 dark:text-gray-400'>
							See what our community has to say about their experience
						</p>
					</div>
					<div className='mx-auto mt-16 grid max-w-6xl gap-8 sm:grid-cols-2 lg:grid-cols-3'>
						<Card
							hover
							className='transition-all hover:shadow-xl dark:bg-gray-800 dark:border-gray-700'>
							<CardContent className='p-8'>
								<div className='flex mb-4'>
									{[...Array(5)].map((_, i) => (
										<span
											key={i}
											className='text-yellow-400 text-xl'>
											★
										</span>
									))}
								</div>
								<p className='text-gray-700 dark:text-gray-300 italic leading-relaxed mb-6'>
									"Found an amazing plumber within 2 hours! He fixed my emergency leak the same day. The proposal system
									made it super easy to compare prices. Best platform for home services!"
								</p>
								<div className='flex items-center gap-3'>
									<div className='h-12 w-12 rounded-full bg-gradient-to-br from-primary-400 to-violet-500 flex items-center justify-center text-white font-bold text-lg'>
										SM
									</div>
									<div>
										<div className='font-semibold text-gray-900 dark:text-gray-100'>Sarah Martinez</div>
										<div className='text-sm text-gray-600 dark:text-gray-400'>Homeowner • Los Angeles, CA</div>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card
							hover
							className='transition-all hover:shadow-xl dark:bg-gray-800 dark:border-gray-700'>
							<CardContent className='p-8'>
								<div className='flex mb-4'>
									{[...Array(5)].map((_, i) => (
										<span
											key={i}
											className='text-yellow-400 text-xl'>
											★
										</span>
									))}
								</div>
								<p className='text-gray-700 dark:text-gray-300 italic leading-relaxed mb-6'>
									"As an electrician, this platform has transformed my business. I get steady work, the payment system
									is reliable, and customers are pre-vetted. Highly recommend to fellow contractors!"
								</p>
								<div className='flex items-center gap-3'>
									<div className='h-12 w-12 rounded-full bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center text-white font-bold text-lg'>
										JD
									</div>
									<div>
										<div className='font-semibold text-gray-900 dark:text-gray-100'>John Davidson</div>
										<div className='text-sm text-gray-600 dark:text-gray-400'>Licensed Electrician • 3,200+ jobs</div>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card
							hover
							className='transition-all hover:shadow-xl dark:bg-gray-800 dark:border-gray-700'>
							<CardContent className='p-8'>
								<div className='flex mb-4'>
									{[...Array(5)].map((_, i) => (
										<span
											key={i}
											className='text-yellow-400 text-xl'>
											★
										</span>
									))}
								</div>
								<p className='text-gray-700 dark:text-gray-300 italic leading-relaxed mb-6'>
									"The background checks gave me total peace of mind. Every provider is verified and insured. I've hired
									cleaners, painters, and movers - all excellent! This is my go-to now."
								</p>
								<div className='flex items-center gap-3'>
									<div className='h-12 w-12 rounded-full bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center text-white font-bold text-lg'>
										ER
									</div>
									<div>
										<div className='font-semibold text-gray-900 dark:text-gray-100'>Emily Rodriguez</div>
										<div className='text-sm text-gray-600 dark:text-gray-400'>Business Owner • Miami, FL</div>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>

				{/* Why Choose Us Section */}
				<div className='bg-white dark:bg-gray-950 py-20'>
					<div className='mx-auto max-w-7xl px-6 lg:px-8'>
						<div className='mx-auto max-w-3xl text-center mb-16'>
							<h2 className='text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100 mb-4'>
								Why Customers & Providers Choose Us
							</h2>
							<p className='text-lg text-gray-600 dark:text-gray-400'>
								The most trusted local service marketplace in North America
							</p>
						</div>

						<div className='grid md:grid-cols-3 gap-8 mb-16'>
							<div className='text-center'>
								<div className='bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-2xl p-8 mb-4 dark:border dark:border-primary-800/30'>
									<div className='text-5xl font-bold text-primary-600 dark:text-primary-400 mb-2'>3.2M+</div>
									<div className='text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide'>
										Jobs Completed
									</div>
								</div>
								<p className='text-gray-600 dark:text-gray-400 text-sm'>More experience than any other platform</p>
							</div>

							<div className='text-center'>
								<div className='bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-2xl p-8 mb-4 dark:border dark:border-green-800/30'>
									<div className='text-5xl font-bold text-accent-600 dark:text-accent-400 mb-2'>98.7%</div>
									<div className='text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide'>
										Customer Satisfaction
									</div>
								</div>
								<p className='text-gray-600 dark:text-gray-400 text-sm'>Industry-leading satisfaction ratings</p>
							</div>

							<div className='text-center'>
								<div className='bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-2xl p-8 mb-4 dark:border dark:border-purple-800/30'>
									<div className='text-5xl font-bold text-violet-600 dark:text-violet-400 mb-2'>₹4,800Cr+</div>
									<div className='text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide'>
										Paid to Providers
									</div>
								</div>
								<p className='text-gray-600 dark:text-gray-400 text-sm'>Supporting local businesses nationwide</p>
							</div>
						</div>

						{/* Competitive Advantages */}
						<div className='bg-gradient-to-br from-gray-950 to-gray-900 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-10 ring-1 ring-white/5 dark:ring-gray-700'>
							<div className='grid md:grid-cols-2 lg:grid-cols-4 gap-8'>
								<div className='text-center md:text-left'>
									<div className='text-2xl mb-3'>🏆</div>
									<div className='font-semibold text-white mb-1 text-sm'>Best-in-Class Platform</div>
									<div className='text-xs text-gray-400'>Rated #1 by customers 4 years running</div>
								</div>

								<div className='text-center md:text-left'>
									<div className='text-2xl mb-3'>⚡</div>
									<div className='font-semibold text-white mb-1 text-sm'>Fastest Response Times</div>
									<div className='text-xs text-gray-400'>Average 2.3 hour quote turnaround</div>
								</div>

								<div className='text-center md:text-left'>
									<div className='text-2xl mb-3'>💰</div>
									<div className='font-semibold text-white mb-1 text-sm'>Lowest Fees</div>
									<div className='text-xs text-gray-400'>Providers keep 95% vs 70-80% elsewhere</div>
								</div>

								<div className='text-center md:text-left'>
									<div className='text-2xl mb-3'>🌟</div>
									<div className='font-semibold text-white mb-1 text-sm'>Verified Quality</div>
									<div className='text-xs text-gray-400'>Multi-step vetting &amp; ongoing monitoring</div>
								</div>
							</div>
						</div>

						{/* Awards & Recognition */}
						<div className='mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto items-center opacity-70 dark:opacity-60'>
							<div className='text-center'>
								<div className='font-bold text-gray-700 dark:text-gray-400 text-sm mb-1'>2024 Best Of</div>
								<div className='text-xs text-gray-600 dark:text-gray-500'>Marketplace Technology</div>
							</div>
							<div className='text-center'>
								<div className='font-bold text-gray-700 dark:text-gray-400 text-sm mb-1'>A+ Rating</div>
								<div className='text-xs text-gray-600 dark:text-gray-500'>Better Business Bureau</div>
							</div>
							<div className='text-center'>
								<div className='font-bold text-gray-700 dark:text-gray-400 text-sm mb-1'>Top Employer</div>
								<div className='text-xs text-gray-600 dark:text-gray-500'>For Service Providers</div>
							</div>
							<div className='text-center'>
								<div className='font-bold text-gray-700 dark:text-gray-400 text-sm mb-1'>Inc. 5000</div>
								<div className='text-xs text-gray-600 dark:text-gray-500'>Fastest Growing</div>
							</div>
						</div>
					</div>
				</div>

				{/* FAQ Section */}
				<div className='bg-gray-50 dark:bg-gray-900 py-24'>
					<div className='mx-auto max-w-7xl px-6 lg:px-8'>
						<div className='mx-auto max-w-3xl text-center mb-16'>
							<h2 className='text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100'>
								Frequently Asked Questions
							</h2>
							<p className='mt-4 text-lg text-gray-600 dark:text-gray-400'>
								Everything you need to know about our platform
							</p>
						</div>
						<div className='mx-auto max-w-4xl'>
							<div className='grid gap-6'>
								{faqs.map((faq, index) => (
									<Card
										key={index}
										className='overflow-hidden transition-all hover:border-primary-200 dark:hover:border-primary-800/60'>
										<CardContent className='p-7'>
											<h3 className='text-base font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-start gap-3'>
												<span className='flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400 text-xs font-bold ring-1 ring-primary-200 dark:ring-primary-800'>
													Q
												</span>
												{faq.question}
											</h3>
											<p className='text-sm text-gray-500 dark:text-gray-400 leading-relaxed ml-9'>{faq.answer}</p>
										</CardContent>
									</Card>
								))}
							</div>
							<div className='mt-12 text-center'>
								<p className='text-gray-600 dark:text-gray-400 mb-4'>Still have questions?</p>
								<Link href='/help'>
									<Button
										variant='outline'
										size='lg'>
										Visit Help Center →
									</Button>
								</Link>
							</div>
						</div>
					</div>
				</div>

				{/* Trust & Guarantees Section */}
				<div className='bg-white dark:bg-gray-950 py-20'>
					<div className='mx-auto max-w-7xl px-6 lg:px-8'>
						<div className='mx-auto max-w-3xl text-center mb-16'>
							<h2 className='text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100 mb-4'>
								Your Safety & Satisfaction is Our Priority
							</h2>
							<p className='text-lg text-gray-600 dark:text-gray-400'>
								We've built multiple layers of protection to ensure every job goes smoothly
							</p>
						</div>

						<div className='grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto'>
							<Card className='border-2 hover:border-primary-400 dark:hover:border-primary-500 transition-all hover:shadow-elevated dark:bg-gray-900 dark:border-gray-800'>
								<CardContent className='p-8 text-center'>
									<div className='w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mx-auto mb-6'>
										<span className='text-3xl'>🛡️</span>
									</div>
									<h3 className='text-lg font-bold text-gray-900 dark:text-gray-100 mb-3'>Payment Protection</h3>
									<p className='text-gray-600 dark:text-gray-400 text-sm leading-relaxed'>
										Funds held in escrow until job completion. Only release payment when you're 100% satisfied with the
										work.
									</p>
								</CardContent>
							</Card>

							<Card className='border-2 hover:border-primary-400 dark:hover:border-primary-500 transition-all hover:shadow-elevated dark:bg-gray-900 dark:border-gray-800'>
								<CardContent className='p-8 text-center'>
									<div className='w-16 h-16 bg-primary-100 dark:bg-primary-900/50 rounded-full flex items-center justify-center mx-auto mb-6'>
										<span className='text-3xl'>✓</span>
									</div>
									<h3 className='text-lg font-bold text-gray-900 dark:text-gray-100 mb-3'>Background Checked</h3>
									<p className='text-gray-600 dark:text-gray-400 text-sm leading-relaxed'>
										All providers undergo identity verification and background screening before they can accept jobs.
									</p>
								</CardContent>
							</Card>

							<Card className='border-2 hover:border-primary-400 dark:hover:border-primary-500 transition-all hover:shadow-elevated dark:bg-gray-900 dark:border-gray-800'>
								<CardContent className='p-8 text-center'>
									<div className='w-16 h-16 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center mx-auto mb-6'>
										<span className='text-3xl'>🔒</span>
									</div>
									<h3 className='text-lg font-bold text-gray-900 dark:text-gray-100 mb-3'>Secure Platform</h3>
									<p className='text-gray-600 dark:text-gray-400 text-sm leading-relaxed'>
										Bank-level encryption, secure messaging, and data protection. Your privacy and security always come
										first.
									</p>
								</CardContent>
							</Card>

							<Card className='border-2 hover:border-primary-400 dark:hover:border-primary-500 transition-all hover:shadow-elevated dark:bg-gray-900 dark:border-gray-800'>
								<CardContent className='p-8 text-center'>
									<div className='w-16 h-16 bg-yellow-100 dark:bg-yellow-900/50 rounded-full flex items-center justify-center mx-auto mb-6'>
										<span className='text-3xl'>💯</span>
									</div>
									<h3 className='text-lg font-bold text-gray-900 dark:text-gray-100 mb-3'>100% Satisfaction</h3>
									<p className='text-gray-600 dark:text-gray-400 text-sm leading-relaxed'>
										Not happy? We'll work with you and the provider to make it right or help you find a replacement.
									</p>
								</CardContent>
							</Card>
						</div>

						{/* Additional Guarantees */}
						<div className='mt-16 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800/50 dark:to-blue-900/20 rounded-2xl p-12 max-w-5xl mx-auto dark:border dark:border-gray-700'>
							<div className='grid md:grid-cols-3 gap-8 text-center'>
								<div>
									<div className='text-3xl font-bold text-primary-600 dark:text-primary-400 mb-2'>₹8Cr+</div>
									<div className='text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1'>Liability Insurance</div>
									<div className='text-xs text-gray-600 dark:text-gray-400'>
										Coverage for every job booked through our platform
									</div>
								</div>
								<div>
									<div className='text-3xl font-bold text-primary-600 dark:text-primary-400 mb-2'>24/7</div>
									<div className='text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1'>Support Team</div>
									<div className='text-xs text-gray-600 dark:text-gray-400'>
										Real humans ready to help, anytime you need
									</div>
								</div>
								<div>
									<div className='text-3xl font-bold text-primary-600 dark:text-primary-400 mb-2'>30-Day</div>
									<div className='text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1'>Quality Guarantee</div>
									<div className='text-xs text-gray-600 dark:text-gray-400'>
										Report issues within 30 days for resolution
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Final CTA Section */}
				<div className='bg-gradient-to-br from-primary-600 via-primary-700 to-violet-800 py-24 relative overflow-hidden'>
					<div className='absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(255,255,255,0.08),transparent)]' />
					<div className='mx-auto max-w-7xl px-6 lg:px-8 relative'>
						<div className='mx-auto max-w-4xl text-center'>
							<h2 className='font-heading text-4xl md:text-5xl font-bold text-white mb-6'>Ready to Get Started?</h2>
							<p className='text-xl text-blue-100 leading-relaxed mb-10'>
								Join 100,000+ satisfied customers and 15,000+ verified professionals. Post your first request for free
								today and get matched with trusted local experts.
							</p>
							<div className='flex flex-col sm:flex-row items-center justify-center gap-4 mb-10'>
								<Link href='/signup'>
									<Button
										size='lg'
										className='bg-white dark:bg-white text-primary-700 dark:text-primary-700 hover:bg-gray-100 dark:hover:bg-gray-100 font-semibold text-lg px-12 py-6 shadow-2xl shadow-black/20 w-full sm:w-auto'>
										Create Free Account →
									</Button>
								</Link>
								<Link href='/requests/create'>
									<Button
										variant='outline'
										size='lg'
										className='border-2 border-white dark:border-white bg-transparent dark:bg-transparent text-white dark:text-white hover:bg-white/10 dark:hover:bg-white/10 hover:border-white dark:hover:border-white font-semibold text-lg px-12 py-6 w-full sm:w-auto'>
										Post a Job Request
									</Button>
								</Link>
							</div>
							<div className='flex flex-wrap justify-center gap-8 text-blue-100 text-sm'>
								<div className='flex items-center gap-2'>
									<span className='text-lg'>✓</span>
									<span>No credit card required</span>
								</div>
								<div className='flex items-center gap-2'>
									<span className='text-lg'>✓</span>
									<span>Free to post requests</span>
								</div>
								<div className='flex items-center gap-2'>
									<span className='text-lg'>✓</span>
									<span>100% satisfaction guarantee</span>
								</div>
								<div className='flex items-center gap-2'>
									<span className='text-lg'>✓</span>
									<span>Get quotes within hours</span>
								</div>
							</div>
						</div>

						{/* Final Stats */}
						<div className='mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto'>
							<div className='text-center'>
								<div className='text-3xl font-bold text-white mb-1'>2M+</div>
								<div className='text-sm text-blue-200'>Service Requests</div>
							</div>
							<div className='text-center'>
								<div className='text-3xl font-bold text-white mb-1'>₹4,100Cr+</div>
								<div className='text-sm text-blue-200'>Paid to Providers</div>
							</div>
							<div className='text-center'>
								<div className='text-3xl font-bold text-white mb-1'>4.9★</div>
								<div className='text-sm text-blue-200'>Average Rating</div>
							</div>
							<div className='text-center'>
								<div className='text-3xl font-bold text-white mb-1'>24/7</div>
								<div className='text-sm text-blue-200'>Customer Support</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</Layout>
	);
}

