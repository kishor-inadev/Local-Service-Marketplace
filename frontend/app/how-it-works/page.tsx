import type { Metadata } from 'next';
import { Layout } from '@/components/layout/Layout';
import { Search, UserCheck, MessageCircle, CheckCircle, Star, Shield } from 'lucide-react';

export const metadata: Metadata = {
	title: 'How It Works',
	description:
		'Discover how Local Service Marketplace works — post a request, get proposals from verified providers, and hire the best fit.',
	alternates: { canonical: '/how-it-works' },
	openGraph: {
		title: 'How It Works',
		description:
			'Discover how Local Service Marketplace works — post a request, get proposals from verified providers, and hire the best fit.',
		url: '/how-it-works',
		images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Local Service Marketplace' }],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'How It Works',
		description:
			'Discover how Local Service Marketplace works — post a request, get proposals from verified providers, and hire the best fit.',
	},
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://localservicemarketplace.com';

const howToJsonLd = {
	'@context': 'https://schema.org',
	'@type': 'HowTo',
	name: 'How to Hire a Local Service Provider',
	description: 'Find and hire trusted local service providers in four simple steps.',
	url: `${SITE_URL}/how-it-works`,
	step: [
		{ '@type': 'HowToStep', position: 1, name: 'Post Your Request', text: 'Describe the service you need and set your budget.' },
		{ '@type': 'HowToStep', position: 2, name: 'Receive Proposals', text: 'Get quotes from verified service providers in your area.' },
		{ '@type': 'HowToStep', position: 3, name: 'Compare & Hire', text: 'Review profiles, ratings, and choose the best fit for your needs.' },
		{ '@type': 'HowToStep', position: 4, name: 'Get It Done', text: 'Work gets completed and you pay securely through our platform.' },
	],
};

export default function HowItWorksPage() {
  return (
    <Layout>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }} />
      <div className="bg-white dark:bg-gray-900">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">How It Works</h1>
            <p className="text-xl text-primary-100">
              Finding and hiring local service providers has never been easier
            </p>
          </div>
        </div>

        {/* For Customers */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              For Customers
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Get your service needs met in four simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full mb-4">
                <Search className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
              <div className="bg-primary-600 dark:bg-primary-500 text-white w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Post Your Request
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Describe the service you need and set your budget
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full mb-4">
                <UserCheck className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
              <div className="bg-primary-600 dark:bg-primary-500 text-white w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Receive Proposals
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Get quotes from verified service providers
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full mb-4">
                <MessageCircle className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
              <div className="bg-primary-600 dark:bg-primary-500 text-white w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Compare & Hire
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Review profiles, ratings, and choose the best fit
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full mb-4">
                <CheckCircle className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
              <div className="bg-primary-600 dark:bg-primary-500 text-white w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
                4
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Get It Done
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Work gets completed and you pay securely
              </p>
            </div>
          </div>
        </div>

        {/* For Providers */}
        <div className="bg-gray-50 dark:bg-gray-800 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                For Service Providers
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Grow your business by connecting with customers who need your services
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-full mb-4">
                  <UserCheck className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Create Profile
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Sign up and complete your professional profile
                </p>
              </div>

              <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-full mb-4">
                  <Search className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Browse Requests
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Find service requests that match your skills
                </p>
              </div>

              <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-full mb-4">
                  <MessageCircle className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Send Proposals
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Submit competitive quotes to potential customers
                </p>
              </div>

              <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-full mb-4">
                  <Star className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Build Reputation
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Earn reviews and grow your business
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Why Our Platform Works
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <div className="flex">
              <div className="flex-shrink-0">
                <Shield className="w-12 h-12 text-primary-600 dark:text-primary-400" />
              </div>
              <div className="ml-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Secure Payments
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  All payments are processed securely. Money is held in escrow until the job is
                  completed to your satisfaction.
                </p>
              </div>
            </div>

            <div className="flex">
              <div className="flex-shrink-0">
                <UserCheck className="w-12 h-12 text-primary-600 dark:text-primary-400" />
              </div>
              <div className="ml-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Verified Providers
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  All service providers go through a verification process including background
                  checks and credential verification.
                </p>
              </div>
            </div>

            <div className="flex">
              <div className="flex-shrink-0">
                <Star className="w-12 h-12 text-primary-600 dark:text-primary-400" />
              </div>
              <div className="ml-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Ratings & Reviews
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Make informed decisions based on real reviews and ratings from other customers.
                </p>
              </div>
            </div>

            <div className="flex">
              <div className="flex-shrink-0">
                <MessageCircle className="w-12 h-12 text-primary-600 dark:text-primary-400" />
              </div>
              <div className="ml-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Direct Communication
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Chat directly with service providers to discuss your needs and expectations.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-primary-600 dark:bg-primary-700 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-xl text-primary-100 mb-8">
              Join our community today
            </p>
            <div className="flex justify-center gap-4">
              <a
                href="/signup"
                className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-primary-50 transition"
              >
                Sign Up Now
              </a>
              <a
                href="/contact"
                className="bg-primary-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-800 transition border-2 border-white"
              >
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
