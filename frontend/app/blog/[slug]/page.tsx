import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Layout } from '@/components/layout/Layout';
import { Breadcrumb } from '@/components/shared/Breadcrumb';
import { BLOG_POSTS } from '../blog-data';
import { Clock, ArrowLeft, ChevronRight } from 'lucide-react';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://localservicemarketplace.com';

// Full article content keyed by slug
const ARTICLE_CONTENT: Record<string, React.ReactNode> = {
	'how-to-find-best-plumber-in-india': (
		<>
			<p>Finding a reliable plumber is one of the most common challenges faced by Indian homeowners. Whether it&apos;s a leaking tap at midnight or a bathroom renovation, the wrong hire can cost you far more than you bargained for.</p>
			<h2>1. Check for Certification</h2>
			<p>In India, plumbers should ideally carry an ITI (Industrial Training Institute) certification in plumbing. While it is not always mandatory, it indicates formal training. Always ask to see credentials before work begins.</p>
			<h2>2. Verify Identity Before Letting Anyone In</h2>
			<p>Always ask for a government-issued ID (Aadhaar, driving licence). Reputable platforms like Local Service Marketplace verify all professionals&apos; identities before onboarding.</p>
			<h2>3. Get Multiple Quotes</h2>
			<p>Don&apos;t accept the first quote. For any plumbing job, collect at least 3 quotes to understand fair market rates in your city. Prices vary significantly between Mumbai, Delhi and smaller tier-2 cities.</p>
			<h2>4. Clarify What&apos;s Included</h2>
			<p>Always ask whether the quote includes materials (pipes, fittings, taps) or just labour. Many plumbers quote labour only, then add material costs separately — sometimes at inflated rates.</p>
			<h2>5. Check Reviews and Ratings</h2>
			<p>Online reviews from verified customers are your best signal. Look for providers with 4.5+ stars and at least 10 reviews. A few negative reviews are normal; check how the provider responded.</p>
			<h2>Typical Plumbing Costs in India (2024)</h2>
			<ul>
				<li>Tap leakage repair: ₹200–₹500</li>
				<li>Drain cleaning: ₹500–₹1,500</li>
				<li>Bathroom fitting installation: ₹1,500–₹5,000</li>
				<li>Water heater installation: ₹800–₹2,500</li>
			</ul>
		</>
	),
	'home-cleaning-tips-india-monsoon': (
		<>
			<p>The Indian monsoon brings relief from the summer heat but also introduces a host of household challenges — humidity, mould, dampness, and increased pest activity. Here&apos;s how to keep your home clean and hygienic during the rainy season.</p>
			<h2>1. Control Indoor Humidity</h2>
			<p>High humidity (above 60%) encourages mould growth. Run your AC on &quot;dry&quot; mode, use dehumidifiers in storage areas, and ensure good ventilation in bathrooms and kitchens.</p>
			<h2>2. Deep Clean Before Monsoon Hits</h2>
			<p>A thorough pre-monsoon deep clean including cupboards, under furniture, and behind appliances removes existing mould spores and dust that thrive in humidity.</p>
			<h2>3. Protect Your Mattresses and Upholstery</h2>
			<p>Keep mattresses elevated, use waterproof covers, and air them on sunny days. Fabric sofas should be vacuumed weekly and treated with anti-fungal spray.</p>
			<h2>4. Keep Drains Clear</h2>
			<p>Clogged drains overflow quickly during heavy rain. Clean all drain covers weekly. For stubborn blockages, call a professional plumber — don&apos;t use harsh chemical drain cleaners that damage pipes.</p>
			<h2>5. Book a Professional Deep Clean</h2>
			<p>Consider booking a professional home deep cleaning service at the start and end of monsoon season. Professionals have the right tools to tackle mould, carpet cleaning, and high-pressure bathroom cleaning.</p>
		</>
	),
	'electrician-safety-tips-india': (
		<>
			<p>Electrical accidents are one of the leading causes of home fires and fatalities in India. With ageing wiring in many urban apartments and unregulated rural installations, knowing basic electrical safety is critical.</p>
			<h2>Warning Signs That Need Immediate Attention</h2>
			<ul>
				<li>Frequent circuit breaker trips</li>
				<li>Buzzing or crackling sounds from switches or outlets</li>
				<li>Lights that flicker or dim unexpectedly</li>
				<li>Burning smell from any switch or outlet</li>
				<li>Switches or sockets that feel warm to touch</li>
			</ul>
			<h2>Never DIY These Electrical Tasks</h2>
			<p>In India, it is illegal and dangerous to perform main panel work, meter connections, or high-voltage wiring without a licensed electrician. Always hire a certified professional for any job beyond replacing a simple bulb.</p>
			<h2>How to Choose a Safe Electrician</h2>
			<p>Look for electricians who carry an ITI Electrician or Wireman certification. Ask whether they carry third-party liability insurance. Reputable platforms pre-verify these credentials.</p>
			<h2>Monsoon Electrical Safety</h2>
			<p>During monsoon, keep switches and sockets dry. Do not use electrical appliances near wet floors. If you experience dampness near your electrical panel, turn off the mains immediately and call a professional.</p>
		</>
	),
	'packers-movers-india-checklist': (
		<>
			<p>Home shifting in India can be stressful, expensive and — if you choose the wrong movers — disastrous. Here&apos;s your comprehensive checklist to ensure a safe, smooth move.</p>
			<h2>Before Booking</h2>
			<ul>
				<li>Get minimum 3 quotes from different companies</li>
				<li>Verify GST registration and company registration</li>
				<li>Check IBA (Indian Banks Association) approval for reliable movers</li>
				<li>Read reviews on Google and moving platforms</li>
				<li>Confirm whether they provide transit insurance</li>
			</ul>
			<h2>Hidden Charges to Watch For</h2>
			<ul>
				<li>Staircase/lift charges (typically ₹200–₹500 per floor)</li>
				<li>Packing material charges (boxes, bubble wrap)</li>
				<li>Octroi or toll charges for interstate moves</li>
				<li>Storage charges if delivery is delayed</li>
			</ul>
			<h2>On Moving Day</h2>
			<ul>
				<li>Take photos of all items before packing</li>
				<li>Create a numbered inventory list with the movers</li>
				<li>Ensure each packed box is labelled with contents and destination room</li>
				<li>Keep valuables (jewellery, documents) with you — do not give to movers</li>
			</ul>
			<h2>Typical Moving Costs in India (2024)</h2>
			<ul>
				<li>Within-city 1 BHK: ₹5,000–₹15,000</li>
				<li>Within-city 3 BHK: ₹12,000–₹30,000</li>
				<li>Interstate (e.g., Mumbai to Delhi): ₹25,000–₹80,000</li>
			</ul>
		</>
	),
	'ac-service-guide-india-summer': (
		<>
			<p>With summer temperatures regularly crossing 42°C in North India and 38°C along the coasts, a well-functioning AC is essential. Here&apos;s what Indian homeowners need to know about AC servicing.</p>
			<h2>When to Service Your AC</h2>
			<ul>
				<li>Before summer begins (March–April): Annual service</li>
				<li>Every 3 months during heavy usage: Filter cleaning</li>
				<li>When cooling efficiency drops noticeably</li>
				<li>After a long period of non-use (post-winter)</li>
			</ul>
			<h2>What&apos;s Included in a Standard AC Service</h2>
			<ul>
				<li>Filter cleaning and replacement if needed</li>
				<li>Coil cleaning (evaporator and condenser)</li>
				<li>Gas (refrigerant) level check</li>
				<li>Drain pipe cleaning</li>
				<li>Electrical connection check</li>
			</ul>
			<h2>Typical AC Service Costs in India (2024)</h2>
			<ul>
				<li>Standard service (1 ton split): ₹400–₹700</li>
				<li>Deep cleaning: ₹700–₹1,500</li>
				<li>Gas refill (per kg): ₹1,500–₹3,000</li>
				<li>Compressor replacement: ₹8,000–₹25,000</li>
			</ul>
			<h2>Save on Electricity Bills</h2>
			<p>A well-serviced AC consumes up to 20% less electricity. Keep your thermostat at 24–26°C (the BEE-recommended setting) and use the fan mode to circulate cool air — reducing compressor runtime.</p>
		</>
	),
	'pest-control-india-guide': (
		<>
			<p>India&apos;s tropical climate makes it one of the most challenging environments for pest control. Here&apos;s what treatment you need for each common pest problem.</p>
			<h2>Cockroach Treatment</h2>
			<p>Gel-based treatments are the most effective for cockroaches in Indian kitchens. A single application lasts 3–6 months and is safe for food preparation areas. Avoid aerosol sprays that push cockroaches deeper into walls.</p>
			<h2>Termite (White Ant) Treatment</h2>
			<p>Termites cause crores of rupees in damage to Indian homes annually. For existing infestations, chemical soil treatment and wood treatment are required. New constructions should use anti-termite treatment during foundation work.</p>
			<h2>Bed Bug Treatment</h2>
			<p>Bed bugs are increasingly common in urban Indian apartments. Heat treatment is the most effective method but expensive. Chemical spray treatments require 2–3 visits over 3–4 weeks to break the egg cycle.</p>
			<h2>Mosquito Treatment</h2>
			<p>Source reduction (eliminating standing water) is the most important step. Professional fogging provides temporary relief (2–4 weeks). Anti-larval treatment in drains and water bodies is more sustainable.</p>
			<h2>Typical Pest Control Costs in India (2024)</h2>
			<ul>
				<li>Cockroach gel treatment (2 BHK): ₹800–₹1,500</li>
				<li>General pest control (2 BHK): ₹1,500–₹3,000</li>
				<li>Termite treatment per sqft: ₹3–₹8</li>
				<li>Bed bug treatment (2 BHK): ₹3,000–₹8,000</li>
			</ul>
		</>
	),
	'home-renovation-cost-india-2024': (
		<>
			<p>Home renovation costs in India vary widely based on city, materials, and quality of labour. Here is a comprehensive, room-by-room cost guide for 2024.</p>
			<h2>Painting</h2>
			<ul>
				<li>Basic distemper: ₹8–₹15 per sqft</li>
				<li>Premium emulsion (Asian Paints/Berger): ₹18–₹35 per sqft</li>
				<li>Texture paint: ₹35–₹80 per sqft</li>
				<li>Wallpaper: ₹50–₹200 per sqft (material + labour)</li>
			</ul>
			<h2>Flooring</h2>
			<ul>
				<li>Ceramic tiles (600×600): ₹35–₹80 per sqft</li>
				<li>Vitrified tiles: ₹55–₹150 per sqft</li>
				<li>Wooden/laminate flooring: ₹80–₹250 per sqft</li>
				<li>Marble: ₹150–₹500+ per sqft</li>
			</ul>
			<h2>Kitchen Renovation</h2>
			<ul>
				<li>Modular kitchen (basic): ₹1.2–₹2 lakh</li>
				<li>Modular kitchen (premium): ₹3–₹8 lakh</li>
				<li>Kitchen countertop replacement: ₹15,000–₹60,000</li>
			</ul>
			<h2>Bathroom Renovation</h2>
			<ul>
				<li>Basic renovation: ₹30,000–₹80,000</li>
				<li>Premium renovation: ₹1–₹3 lakh</li>
				<li>Geyser installation: ₹2,000–₹5,000</li>
			</ul>
			<h2>City-wise Labour Rate Variation</h2>
			<p>Mumbai and Delhi NCR typically cost 25–40% more than tier-2 cities like Pune, Jaipur, or Nagpur for the same work. Always get local quotes.</p>
		</>
	),
	'how-to-verify-service-provider-india': (
		<>
			<p>Inviting a stranger into your home carries inherent risks. Here&apos;s how to verify a service provider&apos;s credentials and ensure your safety when hiring in India.</p>
			<h2>1. Use Verified Platforms</h2>
			<p>The safest way to hire is through platforms that perform background checks. Local Service Marketplace verifies Aadhaar identity, checks criminal records, and validates professional licences before onboarding any provider.</p>
			<h2>2. Ask for Government ID</h2>
			<p>Before any service professional enters your home, ask to see government-issued ID (Aadhaar, PAN, or driving licence). Legitimate professionals will not hesitate. Cross-check the name with your booking confirmation.</p>
			<h2>3. Check Reviews — Look for Patterns</h2>
			<p>Read the most recent 10–15 reviews. Look for patterns: multiple mentions of being late, overcharging, or leaving a mess are red flags. High ratings with very few reviews can be manipulated.</p>
			<h2>4. Confirm the Quote Before Work Starts</h2>
			<p>Get the quote in writing (screenshot the chat, or ask for a written estimate). Any legitimate professional will provide one. Starting work without a confirmed quote is how many overcharging disputes begin.</p>
			<h2>5. Don&apos;t Pay Full Amount Upfront</h2>
			<p>Never pay 100% upfront for large jobs. A 20–30% advance is standard. Final payment after you are satisfied with the work protects you. Use escrow-based payment platforms when available.</p>
			<h2>6. Stay Home During the Service</h2>
			<p>Be present, or have a trusted family member present, while any service professional is in your home. This is a standard safety precaution, especially for new providers you haven&apos;t used before.</p>
		</>
	),
};

interface Props {
	params: { slug: string };
}

export default function BlogPostPage({ params }: Props) {
	const post = BLOG_POSTS.find((p) => p.slug === params.slug);
	if (!post) notFound();

	const content = ARTICLE_CONTENT[params.slug];
	const relatedPosts = BLOG_POSTS.filter((p) => p.slug !== params.slug).slice(0, 3);

	const articleJsonLd = {
		'@context': 'https://schema.org',
		'@type': 'BlogPosting',
		headline: post.title,
		description: post.excerpt,
		url: `${SITE_URL}/blog/${post.slug}`,
		datePublished: post.date,
		dateModified: post.date,
		author: { '@type': 'Organization', name: 'Local Service Marketplace', url: SITE_URL },
		publisher: {
			'@type': 'Organization',
			name: 'Local Service Marketplace',
			logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` },
		},
		mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/blog/${post.slug}` },
		keywords: post.keywords.join(', '),
	};

	return (
		<Layout>
			<script type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
			<div className='bg-white dark:bg-gray-950 min-h-screen'>
				<div className='container-custom py-8'>
					<Breadcrumb
						items={[
							{ label: 'Blog', href: '/blog' },
							{ label: post.category, href: '/blog' },
							{ label: post.title.substring(0, 40) + '…', href: `/blog/${post.slug}` },
						]}
						className='mb-6'
					/>

					<div className='max-w-3xl'>
						<span className='inline-block text-xs font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 px-2.5 py-1 rounded-full mb-4'>
							{post.category}
						</span>
						<h1 className='text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4'>{post.title}</h1>
						<div className='flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-8 pb-8 border-b border-gray-200 dark:border-gray-700'>
							<div className='flex items-center gap-1.5'>
								<Clock className='h-4 w-4' />
								{post.readTime}
							</div>
							<time dateTime={post.date}>
								{new Date(post.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
							</time>
							<span>By Local Service Marketplace</span>
						</div>

						<div className='prose prose-gray dark:prose-invert prose-headings:font-semibold prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-3 prose-p:text-gray-600 dark:prose-p:text-gray-400 prose-p:leading-relaxed prose-ul:text-gray-600 dark:prose-ul:text-gray-400 max-w-none'>
							{content || <p>{post.excerpt}</p>}
						</div>

						{/* CTA */}
						<div className='mt-10 p-6 bg-primary-50 dark:bg-primary-900/20 rounded-2xl'>
							<h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
								Need a Verified Professional?
							</h3>
							<p className='text-gray-600 dark:text-gray-400 text-sm mb-4'>
								Post your requirement free and receive quotes from background-verified professionals in your city.
							</p>
							<Link
								href='/requests/create'
								className='inline-flex items-center gap-1 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors'>
								Post Requirement — Free <ChevronRight className='h-4 w-4' />
							</Link>
						</div>
					</div>

					{/* Related Posts */}
					{relatedPosts.length > 0 && (
						<div className='mt-12'>
							<h2 className='text-xl font-semibold text-gray-800 dark:text-gray-200 mb-6'>Related Articles</h2>
							<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
								{relatedPosts.map((related) => (
									<Link
										key={related.slug}
										href={`/blog/${related.slug}`}
										className='p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary-400 hover:shadow-sm transition-all'>
										<span className='text-xs font-semibold text-primary-600 dark:text-primary-400'>{related.category}</span>
										<h3 className='text-sm font-medium text-gray-900 dark:text-white mt-1 line-clamp-2'>{related.title}</h3>
										<p className='text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1'>
											<Clock className='h-3 w-3' /> {related.readTime}
										</p>
									</Link>
								))}
							</div>
						</div>
					)}

					<div className='mt-8'>
						<Link
							href='/blog'
							className='inline-flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors'>
							<ArrowLeft className='h-4 w-4' />
							Back to Blog
						</Link>
					</div>
				</div>
			</div>
		</Layout>
	);
}
