import { Layout } from '@/components/layout/Layout';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';

const serviceCategories = [
  { name: 'Home Cleaning', icon: '🏠', description: 'Professional cleaning services', jobs: '2.5K+ completed' },
  { name: 'Plumbing', icon: '🔧', description: 'Licensed plumbers', jobs: '3.2K+ completed' },
  { name: 'Electrical', icon: '💡', description: 'Certified electricians', jobs: '1.8K+ completed' },
  { name: 'Landscaping', icon: '🌿', description: 'Garden & lawn care', jobs: '2.1K+ completed' },
  { name: 'Moving', icon: '📦', description: 'Reliable movers', jobs: '1.5K+ completed' },
  { name: 'Painting', icon: '🎨', description: 'Interior & exterior', jobs: '1.3K+ completed' },
  { name: 'HVAC', icon: '❄️', description: 'Heating & cooling', jobs: '900+ completed' },
  { name: 'Carpentry', icon: '🔨', description: 'Custom woodwork', jobs: '850+ completed' },
  { name: 'Appliance Repair', icon: '🔧', description: 'Fix all appliances', jobs: '1.1K+ completed' },
  { name: 'Roofing', icon: '🏘️', description: 'Roof repair & install', jobs: '650+ completed' },
  { name: 'Flooring', icon: '📐', description: 'All flooring types', jobs: '720+ completed' },
  { name: 'Pest Control', icon: '🐛', description: 'Exterminators', jobs: '980+ completed' },
];

const features = [
  {
    title: 'Verified Providers',
    description: 'All service providers undergo background checks, license verification, and identity confirmation for your safety.',
    icon: '✓',
  },
  {
    title: 'Secure Payments',
    description: 'Pay securely through our escrow system with buyer protection, refund guarantees, and fraud prevention.',
    icon: '🔒',
  },
  {
    title: 'Real Reviews',
    description: 'Read authentic reviews from verified customers. Only real job completions can leave feedback.',
    icon: '⭐',
  },
  {
    title: '24/7 Support',
    description: 'Our dedicated customer support team is available around the clock to resolve any concerns.',
    icon: '💬',
  },
  {
    title: 'Local Experts',
    description: 'Connect with professionals in your neighborhood who understand local requirements and codes.',
    icon: '📍',
  },
  {
    title: 'Insurance Protected',
    description: 'All providers carry liability insurance. Jobs are covered by our platform protection guarantee.',
    icon: '🛡️',
  },
];

const stats = [
  { value: '15K+', label: 'Active Providers' },
  { value: '87K+', label: 'Jobs Completed' },
  { value: '4.9/5', label: 'Average Rating' },
  { value: '150+', label: 'Service Categories' },
];

const howItWorksCustomer = [
  {
    step: '1',
    title: 'Describe Your Project',
    description: 'Tell us what you need done. Include photos, budget, timeline, and any special requirements. Get instant matches with qualified providers.',
    image: '📝',
  },
  {
    step: '2',
    title: 'Compare & Chat',
    description: 'Receive proposals within hours. Review provider profiles, ratings, portfolios, and pricing. Ask questions through our secure messaging.',
    image: '💬',
  },
  {
    step: '3',
    title: 'Hire with Confidence',
    description: 'Choose your provider and set milestones. Track progress, communicate in real-time, and release payment when satisfied.',
    image: '✅',
  },
];

const howItWorksProvider = [
  {
    step: '1',
    title: 'Create Your Profile',
    description: 'Set up your professional profile with services, service areas, portfolio, certifications, and pricing.',
    image: '👤',
  },
  {
    step: '2',
    title: 'Find Jobs',
    description: 'Browse requests in your area or get matched automatically. Submit competitive proposals with your timeline and pricing.',
    image: '🔍',
  },
  {
    step: '3',
    title: 'Get Paid Securely',
    description: 'Complete the job, request payment, and receive funds within 1-2 business days via your preferred method.',
    image: '💰',
  },
];

const trustIndicators = [
  { label: 'Background Checked', icon: '🔍' },
  { label: 'Licensed & Insured', icon: '📋' },
  { label: 'Verified Reviews', icon: '⭐' },
  { label: 'Money-Back Guarantee', icon: '💵' },
  { label: 'Secure Payments', icon: '🔐' },
  { label: '24/7 Support', icon: '🆘' },
];

const faqs = [
  {
    question: 'How much does it cost to post a request?',
    answer: 'Posting requests is completely free! You only pay when you hire a provider and the job is completed to your satisfaction.',
  },
  {
    question: 'How are providers verified?',
    answer: 'All providers undergo background checks, license verification, insurance confirmation, and identity validation before joining our platform.',
  },
  {
    question: 'What if I\'m not satisfied with the work?',
    answer: 'We offer a satisfaction guarantee. If work doesn\'t meet agreed standards, we offer mediation, refunds, or free rework through our dispute resolution.',
  },
  {
    question: 'How long does it take to get proposals?',
    answer: 'Most requests receive 3-5 proposals within 24 hours. Urgent requests can get responses within 1-2 hours.',
  },
  {
    question: 'Is my payment secure?',
    answer: 'Yes! Payments are held in escrow and only released when you approve completed work. We use bank-level encryption for all transactions.',
  },
  {
    question: 'Can I message providers before hiring?',
    answer: 'Absolutely! Our secure messaging lets you discuss details, ask questions, and clarify requirements before making a decision.',
  },
];

export default function HomePage() {
  return (
    <Layout>
      <div className="bg-white dark:bg-gray-950">
        {/* Hero Section */}
        <div className="relative isolate overflow-hidden bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <svg
              className="absolute left-[max(50%,25rem)] top-0 h-[64rem] w-[128rem] -translate-x-1/2 stroke-gray-200 dark:stroke-gray-700 [mask-image:radial-gradient(64rem_64rem_at_top,white,transparent)]"
              aria-hidden="true"
            >
              <defs>
                <pattern
                  id="pattern"
                  width={200}
                  height={200}
                  x="50%"
                  y={-1}
                  patternUnits="userSpaceOnUse"
                >
                  <path d="M.5 200V.5H200" fill="none" />
                </pattern>
              </defs>
              <svg x="50%" y={-1} className="overflow-visible fill-gray-50 dark:fill-gray-900">
                <path
                  d="M-200 0h201v201h-201Z M600 0h201v201h-201Z M-400 600h201v201h-201Z M200 800h201v201h-201Z"
                  strokeWidth={0}
                />
              </svg>
              <rect width="100%" height="100%" strokeWidth={0} fill="url(#pattern)" />
            </svg>
          </div>
          
          <div className="mx-auto max-w-7xl px-6 py-20 sm:py-32 lg:px-8">
            <div className="mx-auto max-w-4xl text-center">
              {/* Trust Badge */}
              <div className="mb-8 flex justify-center">
                <div className="relative rounded-full px-4 py-2 text-sm leading-6 text-gray-600 dark:text-gray-300 ring-1 ring-gray-900/10 dark:ring-gray-100/10 hover:ring-gray-900/20 dark:hover:ring-gray-100/20 bg-white dark:bg-gray-800 shadow-sm">
                  ⭐ Rated 4.9/5 by 50,000+ customers • Trusted since 2020
                </div>
              </div>

              <h1 className="text-5xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-7xl">
                Your Local Service <br />
                <span className="text-blue-600 dark:text-blue-400">Marketplace</span>
              </h1>
              <p className="mt-6 text-xl leading-8 text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
                Connect with verified, licensed professionals in your neighborhood. 
                From home repairs to lawn care, find trusted experts for any job. 
                Post your request free, get multiple quotes, and hire with confidence.
              </p>
              
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/signup">
                  <Button size="lg" className="font-semibold text-lg px-8 py-6 w-full sm:w-auto">
                    Get Started Free →
                  </Button>
                </Link>
                <Link href="/requests/create">
                  <Button variant="outline" size="lg" className="font-semibold text-lg px-8 py-6 w-full sm:w-auto">
                    Post a Job Request
                  </Button>
                </Link>
              </div>
              
              {/* Search Bar */}
              <div className="mt-12 max-w-3xl mx-auto">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                    <span className="text-gray-400 dark:text-gray-500 text-xl">🔍</span>
                  </div>
                  <input
                    type="text"
                    placeholder="What service do you need? (e.g., plumbing, house cleaning, electrician)"
                    className="w-full pl-14 pr-32 py-5 text-lg border-2 border-gray-300 dark:border-gray-600 rounded-2xl focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/50 shadow-xl transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                  />
                  <Button className="absolute right-2 top-2 rounded-xl px-6">
                    Search
                  </Button>
                </div>
                <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                  Popular: House Cleaning • Plumbing • Moving • Electrical • Landscaping
                </p>
              </div>

              {/* Trust Indicators */}
              <div className="mt-16 flex flex-wrap justify-center gap-8 text-sm text-gray-600 dark:text-gray-300">
                {trustIndicators.map((indicator) => (
                  <div key={indicator.label} className="flex items-center gap-2">
                    <span className="text-lg">{indicator.icon}</span>
                    <span className="font-medium">{indicator.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 py-16">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center group cursor-pointer">
                  <div className="text-4xl md:text-5xl font-bold text-white group-hover:scale-110 transition-transform">{stat.value}</div>
                  <div className="mt-2 text-base md:text-lg text-blue-100">{stat.label}</div>
                </div>
              ))}
            </div>
            <div className="mt-12 text-center">
              <p className="text-blue-100 text-lg">
                🎉 1,000+ jobs completed this week • 500+ new providers joined this month
              </p>
            </div>
          </div>
        </div>

        {/* Service Categories Section */}
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Popular Service Categories
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
              Explore our most requested services or browse over 150+ categories
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-6xl grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {serviceCategories.map((category) => (
              <Card key={category.name} hover className="cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1 dark:bg-gray-800 dark:border-gray-700">
                <CardContent className="flex flex-col items-center text-center p-6">
                  <div className="text-5xl mb-4">{category.icon}</div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">{category.name}</h3>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{category.description}</p>
                  <p className="mt-3 text-xs font-medium text-blue-600 dark:text-blue-400">{category.jobs}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link href="/requests/create">
              <Button variant="outline" size="lg" className="text-lg px-8">
                View All 150+ Categories →
              </Button>
            </Link>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                How It Works
              </h2>
              <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
                Simple, transparent, and secure process for customers and providers
              </p>
            </div>

            {/* For Customers */}
            <div className="mt-16">
              <div className="text-center mb-12">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">For Customers</h3>
                <p className="text-gray-600 dark:text-gray-400">Get your project done in three easy steps</p>
              </div>
              <div className="mx-auto max-w-6xl">
                <div className="grid gap-8 lg:grid-cols-3">
                  {howItWorksCustomer.map((item) => (
                    <div key={item.step} className="relative">
                      <div className="flex flex-col items-center text-center">
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white text-4xl font-bold shadow-xl mb-2">
                          {item.image}
                        </div>
                        <div className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white text-sm font-bold shadow-lg">
                          {item.step}
                        </div>
                        <h3 className="mt-6 text-xl font-semibold text-gray-900 dark:text-gray-100">
                          {item.title}
                        </h3>
                        <p className="mt-4 text-gray-600 dark:text-gray-400 text-base leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* For Providers */}
            <div className="mt-24 pt-12 border-t-2 border-gray-200 dark:border-gray-700">
              <div className="text-center mb-12">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">For Service Providers</h3>
                <p className="text-gray-600 dark:text-gray-400">Start growing your business today</p>
              </div>
              <div className="mx-auto max-w-6xl">
                <div className="grid gap-8 lg:grid-cols-3">
                  {howItWorksProvider.map((item) => (
                    <div key={item.step} className="relative">
                      <div className="flex flex-col items-center text-center">
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-green-700 text-white text-4xl font-bold shadow-xl mb-2">
                          {item.image}
                        </div>
                        <div className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-white text-sm font-bold shadow-lg">
                          {item.step}
                        </div>
                        <h3 className="mt-6 text-xl font-semibold text-gray-900 dark:text-gray-100">
                          {item.title}
                        </h3>
                        <p className="mt-4 text-gray-600 dark:text-gray-400 text-base leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* CTA to Learn More */}
            <div className="mt-16 text-center">
              <Link href="/how-it-works">
                <Button variant="outline" size="lg" className="text-lg px-8">
                  Learn More About Our Process →
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8 bg-white dark:bg-gray-950">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Why Thousands Choose Us
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
              The safest, easiest way to hire local service professionals
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-6xl gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title} hover className="transition-all hover:shadow-xl dark:bg-gray-800 dark:border-gray-700">
                <CardContent className="p-8">
                  <div className="flex flex-col">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/50 text-3xl mb-4">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{feature.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Additional Trust Signals */}
          <div className="mt-20 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-3xl p-12 dark:border dark:border-gray-700">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-5xl mb-4">🏆</div>
                <h4 className="font-bold text-gray-900 dark:text-gray-100 text-lg mb-2">Award Winning</h4>
                <p className="text-gray-600 dark:text-gray-400">Best Local Service Platform 2025</p>
              </div>
              <div>
                <div className="text-5xl mb-4">💳</div>
                <h4 className="font-bold text-gray-900 dark:text-gray-100 text-lg mb-2">Escrow Protection</h4>
                <p className="text-gray-600 dark:text-gray-400">Your money held safely until job completion</p>
              </div>
              <div>
                <div className="text-5xl mb-4">⚡</div>
                <h4 className="font-bold text-gray-900 dark:text-gray-100 text-lg mb-2">Fast Matching</h4>
                <p className="text-gray-600 dark:text-gray-400">Get quotes within hours, not days</p>
              </div>
            </div>
          </div>
        </div>

        {/* Provider CTA Section */}
        <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
          <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8 relative">
            <div className="mx-auto max-w-4xl text-center">
              <div className="inline-flex items-center rounded-full bg-blue-500/20 px-6 py-2 mb-6 backdrop-blur-sm">
                <span className="text-blue-100 font-medium">💼 For Service Professionals</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white">
                Grow Your Local Business
              </h2>
              <p className="mt-6 text-xl text-blue-100 leading-relaxed">
                Join 15,000+ trusted professionals earning more with our platform. 
                Get matched with ready-to-hire customers in your area. Set your own rates, 
                choose your jobs, and get paid fast.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/signup">
                  <Button 
                    size="lg" 
                    className="bg-white dark:bg-gray-100 text-blue-600 dark:text-blue-700 hover:bg-gray-100 dark:hover:bg-gray-200 font-semibold text-lg px-10 py-6 w-full sm:w-auto shadow-xl"
                  >
                    Join as Provider →
                  </Button>
                </Link>
                <Link href="/login">
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="border-2 border-white dark:border-gray-200 text-white dark:text-gray-200 hover:bg-blue-700 dark:hover:bg-blue-800/50 font-semibold text-lg px-10 py-6 w-full sm:w-auto"
                  >
                    Provider Login
                  </Button>
                </Link>
              </div>
              
              {/* Provider Benefits */}
              <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  <div className="text-4xl font-bold text-white mb-2">$0</div>
                  <div className="text-lg font-semibold text-blue-100 mb-1">To Join</div>
                  <div className="text-sm text-blue-200">No subscription fees or upfront costs</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  <div className="text-4xl font-bold text-white mb-2">95%</div>
                  <div className="text-lg font-semibold text-blue-100 mb-1">You Keep</div>
                  <div className="text-sm text-blue-200">Industry-low 5% service fee</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  <div className="text-4xl font-bold text-white mb-2">1-2</div>
                  <div className="text-lg font-semibold text-blue-100 mb-1">Day Payout</div>
                  <div className="text-sm text-blue-200">Fast, secure payment transfers</div>
                </div>
              </div>

              {/* Additional Provider Benefits */}
              <div className="mt-12 flex flex-wrap justify-center gap-6 text-blue-100">
                <div className="flex items-center gap-2">
                  <span className="text-xl">✓</span>
                  <span>Build Your Brand</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">✓</span>
                  <span>Verified Reviews</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">✓</span>
                  <span>Marketing Tools</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">✓</span>
                  <span>Calendar Management</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">✓</span>
                  <span>Mobile App</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Testimonials Section */}
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8 bg-white dark:bg-gray-950">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Loved by Customers & Professionals
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
              See what our community has to say about their experience
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-6xl gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <Card hover className="transition-all hover:shadow-xl dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="p-8">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-xl">★</span>
                  ))}
                </div>
                <p className="text-gray-700 dark:text-gray-300 italic leading-relaxed mb-6">
                  "Found an amazing plumber within 2 hours! He fixed my emergency leak 
                  the same day. The proposal system made it super easy to compare prices. 
                  Best platform for home services!"
                </p>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                    SM
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-gray-100">Sarah Martinez</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Homeowner • Los Angeles, CA</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card hover className="transition-all hover:shadow-xl dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="p-8">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-xl">★</span>
                  ))}
                </div>
                <p className="text-gray-700 dark:text-gray-300 italic leading-relaxed mb-6">
                  "As an electrician, this platform has transformed my business. 
                  I get steady work, the payment system is reliable, and customers 
                  are pre-vetted. Highly recommend to fellow contractors!"
                </p>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold text-lg">
                    JD
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-gray-100">John Davidson</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Licensed Electrician • 3,200+ jobs</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card hover className="transition-all hover:shadow-xl dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="p-8">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-xl">★</span>
                  ))}
                </div>
                <p className="text-gray-700 dark:text-gray-300 italic leading-relaxed mb-6">
                  "The background checks gave me total peace of mind. Every provider 
                  is verified and insured. I've hired cleaners, painters, and movers 
                  - all excellent! This is my go-to now."
                </p>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                    ER
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-gray-100">Emily Rodriguez</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Business Owner • Miami, FL</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Why Choose Us Section */}
        <div className="bg-white dark:bg-gray-950 py-20">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center mb-16">
              <h2 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100 mb-4">
                Why Customers & Providers Choose Us
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                The most trusted local service marketplace in North America
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-16">
              <div className="text-center">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl p-8 mb-4 dark:border dark:border-blue-800/30">
                  <div className="text-5xl font-bold text-blue-600 dark:text-blue-400 mb-2">3.2M+</div>
                  <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Jobs Completed</div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  More experience than any other platform
                </p>
              </div>

              <div className="text-center">
                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-2xl p-8 mb-4 dark:border dark:border-green-800/30">
                  <div className="text-5xl font-bold text-green-600 dark:text-green-400 mb-2">98.7%</div>
                  <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Customer Satisfaction</div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Industry-leading satisfaction ratings
                </p>
              </div>

              <div className="text-center">
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-2xl p-8 mb-4 dark:border dark:border-purple-800/30">
                  <div className="text-5xl font-bold text-purple-600 dark:text-purple-400 mb-2">$580M+</div>
                  <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Paid to Providers</div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Supporting local businesses nationwide
                </p>
              </div>
            </div>

            {/* Competitive Advantages */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-800 dark:to-gray-950 rounded-3xl p-12 text-white dark:border dark:border-gray-700">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="text-center md:text-left">
                  <div className="text-3xl mb-3">🏆</div>
                  <div className="font-bold mb-2">Best-in-Class Platform</div>
                  <div className="text-sm text-gray-300">Rated #1 by customers 4 years running</div>
                </div>

                <div className="text-center md:text-left">
                  <div className="text-3xl mb-3">⚡</div>
                  <div className="font-bold mb-2">Fastest Response Times</div>
                  <div className="text-sm text-gray-300">Average 2.3 hour quote turnaround</div>
                </div>

                <div className="text-center md:text-left">
                  <div className="text-3xl mb-3">💰</div>
                  <div className="font-bold mb-2">Lowest Fees</div>
                  <div className="text-sm text-gray-300">Providers keep 95% vs 70-80% elsewhere</div>
                </div>

                <div className="text-center md:text-left">
                  <div className="text-3xl mb-3">🌟</div>
                  <div className="font-bold mb-2">Verified Quality</div>
                  <div className="text-sm text-gray-300">Multi-step vetting & ongoing monitoring</div>
                </div>
              </div>
            </div>

            {/* Awards & Recognition */}
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto items-center opacity-70 dark:opacity-60">
              <div className="text-center">
                <div className="font-bold text-gray-700 dark:text-gray-400 text-sm mb-1">2024 Best Of</div>
                <div className="text-xs text-gray-600 dark:text-gray-500">Marketplace Technology</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-gray-700 dark:text-gray-400 text-sm mb-1">A+ Rating</div>
                <div className="text-xs text-gray-600 dark:text-gray-500">Better Business Bureau</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-gray-700 dark:text-gray-400 text-sm mb-1">Top Employer</div>
                <div className="text-xs text-gray-600 dark:text-gray-500">For Service Providers</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-gray-700 dark:text-gray-400 text-sm mb-1">Inc. 5000</div>
                <div className="text-xs text-gray-600 dark:text-gray-500">Fastest Growing</div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-gray-50 dark:bg-gray-900 py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center mb-16">
              <h2 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                Frequently Asked Questions
              </h2>
              <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
                Everything you need to know about our platform
              </p>
            </div>
            <div className="mx-auto max-w-4xl">
              <div className="grid gap-6">
                {faqs.map((faq, index) => (
                  <Card key={index} className="overflow-hidden dark:bg-gray-800 dark:border-gray-700">
                    <CardContent className="p-8">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-start gap-3">
                        <span className="flex-shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-sm font-bold">
                          ?
                        </span>
                        {faq.question}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 leading-relaxed ml-10">{faq.answer}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="mt-12 text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-4">Still have questions?</p>
                <Link href="/help">
                  <Button variant="outline" size="lg">
                    Visit Help Center →
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Trust & Guarantees Section */}
        <div className="bg-white dark:bg-gray-950 py-20">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center mb-16">
              <h2 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100 mb-4">
                Your Safety & Satisfaction is Our Priority
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                We've built multiple layers of protection to ensure every job goes smoothly
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
              <Card className="border-2 hover:border-blue-500 dark:hover:border-blue-400 transition-all hover:shadow-lg dark:bg-gray-800 dark:border-gray-700">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-3xl">🛡️</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">Payment Protection</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                    Funds held in escrow until job completion. Only release payment when you're 100% satisfied with the work.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-blue-500 dark:hover:border-blue-400 transition-all hover:shadow-lg dark:bg-gray-800 dark:border-gray-700">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-3xl">✓</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">Background Checked</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                    All providers undergo identity verification and background screening before they can accept jobs.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-blue-500 dark:hover:border-blue-400 transition-all hover:shadow-lg dark:bg-gray-800 dark:border-gray-700">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-3xl">🔒</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">Secure Platform</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                    Bank-level encryption, secure messaging, and data protection. Your privacy and security always come first.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-blue-500 dark:hover:border-blue-400 transition-all hover:shadow-lg dark:bg-gray-800 dark:border-gray-700">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-3xl">💯</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">100% Satisfaction</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                    Not happy? We'll work with you and the provider to make it right or help you find a replacement.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Additional Guarantees */}
            <div className="mt-16 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800/50 dark:to-blue-900/20 rounded-2xl p-12 max-w-5xl mx-auto dark:border dark:border-gray-700">
              <div className="grid md:grid-cols-3 gap-8 text-center">
                <div>
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">$1M+</div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Liability Insurance</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Coverage for every job booked through our platform</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">24/7</div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Support Team</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Real humans ready to help, anytime you need</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">30-Day</div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Quality Guarantee</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Report issues within 30 days for resolution</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Final CTA Section */}
        <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
          <div className="mx-auto max-w-7xl px-6 lg:px-8 relative">
            <div className="mx-auto max-w-4xl text-center">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Ready to Get Started?
              </h2>
              <p className="text-xl text-blue-100 leading-relaxed mb-10">
                Join 100,000+ satisfied customers and 15,000+ verified professionals. 
                Post your first request for free today and get matched with trusted local experts.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
                <Link href="/signup">
                  <Button size="lg" className="bg-white dark:bg-gray-100 text-blue-600 dark:text-blue-700 hover:bg-gray-100 dark:hover:bg-gray-200 font-semibold text-lg px-12 py-6 shadow-2xl w-full sm:w-auto">
                    Create Free Account →
                  </Button>
                </Link>
                <Link href="/requests/create">
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="border-2 border-white dark:border-gray-200 text-white dark:text-gray-200 hover:bg-blue-700 dark:hover:bg-blue-800/50 font-semibold text-lg px-12 py-6 w-full sm:w-auto"
                  >
                    Post a Job Request
                  </Button>
                </Link>
              </div>
              <div className="flex flex-wrap justify-center gap-8 text-blue-100 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-lg">✓</span>
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">✓</span>
                  <span>Free to post requests</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">✓</span>
                  <span>100% satisfaction guarantee</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">✓</span>
                  <span>Get quotes within hours</span>
                </div>
              </div>
            </div>

            {/* Final Stats */}
            <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">2M+</div>
                <div className="text-sm text-blue-200">Service Requests</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">$500M+</div>
                <div className="text-sm text-blue-200">Paid to Providers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">4.9★</div>
                <div className="text-sm text-blue-200">Average Rating</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">24/7</div>
                <div className="text-sm text-blue-200">Customer Support</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
