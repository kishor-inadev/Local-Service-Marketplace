export interface CityData {
	slug: string;
	name: string;
	state: string;
}

export interface ServiceSlugData {
	slug: string;
	name: string;
	description: string;
	icon: string;
}

export const INDIA_CITIES: CityData[] = [
	{ slug: 'mumbai', name: 'Mumbai', state: 'Maharashtra' },
	{ slug: 'delhi', name: 'Delhi', state: 'Delhi' },
	{ slug: 'bengaluru', name: 'Bengaluru', state: 'Karnataka' },
	{ slug: 'hyderabad', name: 'Hyderabad', state: 'Telangana' },
	{ slug: 'chennai', name: 'Chennai', state: 'Tamil Nadu' },
	{ slug: 'kolkata', name: 'Kolkata', state: 'West Bengal' },
	{ slug: 'pune', name: 'Pune', state: 'Maharashtra' },
	{ slug: 'ahmedabad', name: 'Ahmedabad', state: 'Gujarat' },
	{ slug: 'jaipur', name: 'Jaipur', state: 'Rajasthan' },
	{ slug: 'surat', name: 'Surat', state: 'Gujarat' },
	{ slug: 'lucknow', name: 'Lucknow', state: 'Uttar Pradesh' },
	{ slug: 'kanpur', name: 'Kanpur', state: 'Uttar Pradesh' },
	{ slug: 'nagpur', name: 'Nagpur', state: 'Maharashtra' },
	{ slug: 'indore', name: 'Indore', state: 'Madhya Pradesh' },
	{ slug: 'thane', name: 'Thane', state: 'Maharashtra' },
	{ slug: 'bhopal', name: 'Bhopal', state: 'Madhya Pradesh' },
	{ slug: 'visakhapatnam', name: 'Visakhapatnam', state: 'Andhra Pradesh' },
	{ slug: 'pimpri-chinchwad', name: 'Pimpri-Chinchwad', state: 'Maharashtra' },
	{ slug: 'patna', name: 'Patna', state: 'Bihar' },
	{ slug: 'vadodara', name: 'Vadodara', state: 'Gujarat' },
	{ slug: 'ghaziabad', name: 'Ghaziabad', state: 'Uttar Pradesh' },
	{ slug: 'ludhiana', name: 'Ludhiana', state: 'Punjab' },
	{ slug: 'agra', name: 'Agra', state: 'Uttar Pradesh' },
	{ slug: 'nashik', name: 'Nashik', state: 'Maharashtra' },
	{ slug: 'faridabad', name: 'Faridabad', state: 'Haryana' },
	{ slug: 'meerut', name: 'Meerut', state: 'Uttar Pradesh' },
	{ slug: 'rajkot', name: 'Rajkot', state: 'Gujarat' },
	{ slug: 'kalyan', name: 'Kalyan', state: 'Maharashtra' },
	{ slug: 'vasai-virar', name: 'Vasai-Virar', state: 'Maharashtra' },
	{ slug: 'varanasi', name: 'Varanasi', state: 'Uttar Pradesh' },
	{ slug: 'srinagar', name: 'Srinagar', state: 'Jammu & Kashmir' },
	{ slug: 'aurangabad', name: 'Aurangabad', state: 'Maharashtra' },
	{ slug: 'dhanbad', name: 'Dhanbad', state: 'Jharkhand' },
	{ slug: 'amritsar', name: 'Amritsar', state: 'Punjab' },
	{ slug: 'navi-mumbai', name: 'Navi Mumbai', state: 'Maharashtra' },
	{ slug: 'allahabad', name: 'Prayagraj', state: 'Uttar Pradesh' },
	{ slug: 'howrah', name: 'Howrah', state: 'West Bengal' },
	{ slug: 'ranchi', name: 'Ranchi', state: 'Jharkhand' },
	{ slug: 'coimbatore', name: 'Coimbatore', state: 'Tamil Nadu' },
	{ slug: 'jabalpur', name: 'Jabalpur', state: 'Madhya Pradesh' },
	{ slug: 'gwalior', name: 'Gwalior', state: 'Madhya Pradesh' },
	{ slug: 'vijayawada', name: 'Vijayawada', state: 'Andhra Pradesh' },
	{ slug: 'jodhpur', name: 'Jodhpur', state: 'Rajasthan' },
	{ slug: 'madurai', name: 'Madurai', state: 'Tamil Nadu' },
	{ slug: 'raipur', name: 'Raipur', state: 'Chhattisgarh' },
	{ slug: 'kota', name: 'Kota', state: 'Rajasthan' },
	{ slug: 'chandigarh', name: 'Chandigarh', state: 'Chandigarh' },
	{ slug: 'guwahati', name: 'Guwahati', state: 'Assam' },
	{ slug: 'solapur', name: 'Solapur', state: 'Maharashtra' },
	{ slug: 'bhubaneswar', name: 'Bhubaneswar', state: 'Odisha' },
];

export const SERVICE_SLUGS: ServiceSlugData[] = [
	{
		slug: 'home-cleaning',
		name: 'Home Cleaning',
		description: 'Professional home cleaning, deep cleaning and maid services',
		icon: '🏠',
	},
	{
		slug: 'plumbing',
		name: 'Plumbing',
		description: 'Licensed plumbers for repairs, installations and emergencies',
		icon: '🔧',
	},
	{
		slug: 'electrical',
		name: 'Electrical',
		description: 'Certified electricians for wiring, repairs and installations',
		icon: '⚡',
	},
	{
		slug: 'carpentry',
		name: 'Carpentry',
		description: 'Expert carpenters for furniture, doors and woodwork',
		icon: '🪵',
	},
	{
		slug: 'painting',
		name: 'Painting',
		description: 'Interior and exterior painting services for home and office',
		icon: '🎨',
	},
	{
		slug: 'pest-control',
		name: 'Pest Control',
		description: 'Professional pest control and termite treatment services',
		icon: '🐛',
	},
	{
		slug: 'ac-repair',
		name: 'AC Repair & Service',
		description: 'AC service, repair and installation by certified technicians',
		icon: '❄️',
	},
	{
		slug: 'appliance-repair',
		name: 'Appliance Repair',
		description: 'Washing machine, refrigerator and appliance repair services',
		icon: '🔌',
	},
	{
		slug: 'moving-packing',
		name: 'Moving & Packing',
		description: 'Home shifting, packing and moving services across India',
		icon: '📦',
	},
	{
		slug: 'landscaping',
		name: 'Landscaping & Gardening',
		description: 'Garden maintenance, lawn care and landscaping services',
		icon: '🌿',
	},
	{
		slug: 'beauty-wellness',
		name: 'Beauty & Wellness',
		description: 'At-home beauty, salon and wellness services',
		icon: '💆',
	},
	{
		slug: 'tutoring',
		name: 'Tutoring & Education',
		description: 'Home tutors for school, college and competitive exams',
		icon: '📚',
	},
	{
		slug: 'photography',
		name: 'Photography',
		description: 'Wedding, event and professional photography services',
		icon: '📷',
	},
	{
		slug: 'security',
		name: 'Security Services',
		description: 'CCTV installation, security guard and surveillance services',
		icon: '🔒',
	},
];

export const SERVICE_META: Record<string, { title: string; description: string; keywords: string[] }> = {
	'home-cleaning': {
		title: 'Home Cleaning Services',
		description: 'Find verified home cleaning professionals near you. Get deep cleaning, regular maid service and more.',
		keywords: ['home cleaning', 'maid service', 'deep cleaning', 'house cleaning', 'cleaning service'],
	},
	plumbing: {
		title: 'Plumber Services',
		description: 'Book licensed plumbers for pipe repair, tap installation, bathroom fitting and plumbing emergencies.',
		keywords: ['plumber', 'plumbing services', 'pipe repair', 'tap fitting', 'bathroom plumbing'],
	},
	electrical: {
		title: 'Electrician Services',
		description: 'Hire certified electricians for wiring, switch board repair, fan installation and electrical work.',
		keywords: ['electrician', 'electrical repair', 'wiring', 'fan installation', 'electrical services'],
	},
	carpentry: {
		title: 'Carpenter Services',
		description: 'Find expert carpenters for furniture making, door repair, modular kitchen and woodwork.',
		keywords: ['carpenter', 'carpentry', 'furniture', 'woodwork', 'door repair'],
	},
	painting: {
		title: 'Painting Services',
		description: 'Book professional painters for interior, exterior and texture painting at best prices.',
		keywords: ['painter', 'painting service', 'wall painting', 'home painting', 'interior painting'],
	},
	'pest-control': {
		title: 'Pest Control Services',
		description: 'Book professional pest control for cockroach, termite, bed bugs and mosquito treatment.',
		keywords: ['pest control', 'termite treatment', 'cockroach control', 'bed bug treatment'],
	},
	'ac-repair': {
		title: 'AC Repair & Service',
		description: 'Get your AC serviced or repaired by certified technicians. All brands covered.',
		keywords: ['AC repair', 'AC service', 'air conditioner repair', 'AC installation', 'AC gas refill'],
	},
	'appliance-repair': {
		title: 'Home Appliance Repair',
		description: 'Book washing machine, refrigerator, microwave and appliance repair at home.',
		keywords: ['washing machine repair', 'refrigerator repair', 'appliance repair', 'microwave repair'],
	},
	'moving-packing': {
		title: 'Packers & Movers',
		description: 'Trusted packers and movers for home shifting, office relocation and transport.',
		keywords: ['packers and movers', 'home shifting', 'office relocation', 'moving service'],
	},
	landscaping: {
		title: 'Landscaping & Gardening Services',
		description: 'Book professional gardeners for lawn mowing, garden design and maintenance.',
		keywords: ['landscaping', 'gardening', 'lawn mowing', 'garden maintenance', 'plant care'],
	},
	'beauty-wellness': {
		title: 'Beauty & Salon Services at Home',
		description: 'Book home salon services — facial, waxing, hair care and more delivered at your doorstep.',
		keywords: ['home salon', 'beauty services', 'facial at home', 'waxing', 'spa at home'],
	},
	tutoring: {
		title: 'Home Tutor Services',
		description: 'Find qualified home tutors for all subjects, competitive exams and skill development.',
		keywords: ['home tutor', 'tutoring', 'private tutor', 'IIT coaching', 'CBSE tutor'],
	},
	photography: {
		title: 'Photography Services',
		description: 'Hire professional photographers for weddings, events, portraits and product photography.',
		keywords: ['photographer', 'wedding photography', 'event photography', 'portrait photography'],
	},
	security: {
		title: 'Security Services',
		description: 'Book CCTV installation, security guards and home surveillance at competitive prices.',
		keywords: ['security services', 'CCTV installation', 'security guard', 'home security'],
	},
};
