export interface BlogPost {
	slug: string;
	title: string;
	excerpt: string;
	date: string;
	dateModified: string;
	readTime: string;
	category: string;
	keywords: string[];
}

export function categoryToSlug(category: string): string {
	return category.toLowerCase().replace(/\s+/g, '-');
}

export const BLOG_POSTS: BlogPost[] = [
	{
		slug: 'how-to-find-best-plumber-in-india',
		title: 'How to Find the Best Plumber in India: Complete Guide 2026',
		excerpt:
			'Finding a reliable plumber can be stressful. Learn how to verify credentials, get fair quotes and avoid common scams when hiring plumbing services in Indian cities.',
		date: '2024-01-15',
		dateModified: '2026-01-10',
		readTime: '6 min read',
		category: 'Hiring Guide',
		keywords: ['plumber in India', 'how to hire plumber', 'plumbing services India', 'best plumber'],
	},
	{
		slug: 'home-cleaning-tips-india-monsoon',
		title: 'Home Cleaning Tips for Indian Monsoon Season',
		excerpt:
			'Monsoon brings humidity, mould and pests. Discover expert home cleaning strategies to keep your Indian home fresh and hygienic during the rainy season.',
		date: '2024-02-10',
		dateModified: '2026-04-01',
		readTime: '5 min read',
		category: 'Home Tips',
		keywords: ['home cleaning India', 'monsoon cleaning tips', 'mould prevention India', 'rainy season cleaning'],
	},
	{
		slug: 'electrician-safety-tips-india',
		title: 'Electrical Safety Tips Every Indian Homeowner Must Know',
		excerpt:
			'Electrical accidents are common in Indian homes. Learn essential safety checks, when to call a certified electrician, and how to prevent electrical hazards.',
		date: '2024-03-05',
		dateModified: '2025-11-20',
		readTime: '7 min read',
		category: 'Safety',
		keywords: ['electrical safety India', 'electrician India', 'home electrical tips', 'power surge India'],
	},
	{
		slug: 'packers-movers-india-checklist',
		title: 'Complete Packers & Movers Checklist for Home Shifting in India',
		excerpt:
			'Moving homes in India? Use our comprehensive checklist to plan your shift, verify movers credentials, avoid hidden charges and ensure a smooth relocation.',
		date: '2024-03-20',
		dateModified: '2025-09-15',
		readTime: '8 min read',
		category: 'Moving Guide',
		keywords: ['packers movers India', 'home shifting checklist', 'relocation India', 'moving tips India'],
	},
	{
		slug: 'ac-service-guide-india-summer',
		title: 'AC Service & Maintenance Guide for Indian Summers',
		excerpt:
			'With temperatures crossing 45°C in many Indian cities, your AC needs regular servicing. Learn when to service, what is included, and how to save on electricity bills.',
		date: '2024-04-01',
		dateModified: '2026-03-15',
		readTime: '6 min read',
		category: 'Maintenance',
		keywords: ['AC service India', 'air conditioner maintenance India', 'AC repair cost India', 'summer home tips'],
	},
	{
		slug: 'pest-control-india-guide',
		title: 'Pest Control in India: Which Treatment Do You Need?',
		excerpt:
			'Cockroaches, termites, mosquitoes, bed bugs — Indian homes face many pest threats. Learn which pest control treatment is right for your problem and how much it costs.',
		date: '2024-04-15',
		dateModified: '2025-10-01',
		readTime: '7 min read',
		category: 'Pest Control',
		keywords: ['pest control India', 'termite treatment India', 'bed bug treatment India', 'cockroach control'],
	},
	{
		slug: 'home-renovation-cost-india-2024',
		title: 'Home Renovation Cost Guide India 2026: Room-by-Room Breakdown',
		excerpt:
			'Planning a home renovation in Mumbai, Delhi or Bengaluru? Get realistic cost estimates for painting, flooring, kitchen and bathroom renovation across Indian cities.',
		date: '2024-05-01',
		dateModified: '2026-02-10',
		readTime: '10 min read',
		category: 'Cost Guide',
		keywords: ['home renovation cost India', 'house renovation India', 'interior design cost India', 'painting cost India'],
	},
	{
		slug: 'how-to-verify-service-provider-india',
		title: 'How to Verify a Service Provider in India Before Hiring',
		excerpt:
			'Hiring an unverified technician can be risky. Learn how to check credentials, read reviews, verify identity and ensure safe service delivery in your home.',
		date: '2024-05-15',
		dateModified: '2025-12-05',
		readTime: '5 min read',
		category: 'Consumer Guide',
		keywords: ['verify service provider India', 'safe hiring tips India', 'how to check plumber credentials', 'verified professionals India'],
	},
];

export const BLOG_CATEGORIES = [...new Set(BLOG_POSTS.map((p) => p.category))] as string[];
