import type { Metadata } from 'next';
import { Layout } from '@/components/layout/Layout';
import { Users, Target, Award, Heart } from 'lucide-react';

export const metadata: Metadata = {
	title: 'About Us',
	description:
		'Learn about Local Service Marketplace — our mission, team, and how we connect local service providers with customers.',
	alternates: { canonical: '/about' },
	openGraph: {
		title: 'About Us',
		description:
			'Learn about Local Service Marketplace — our mission, team, and how we connect local service providers with customers.',
		url: '/about',
		type: 'website',
		locale: 'en_IN',
		images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Local Service Marketplace' }],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'About Us',
		description:
			'Learn about Local Service Marketplace — our mission, team, and how we connect local service providers with customers.',
	},
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://localservicemarketplace.com';

const organizationJsonLd = {
	'@context': 'https://schema.org',
	'@type': 'Organization',
	name: 'Local Service Marketplace',
	url: SITE_URL,
	logo: `${SITE_URL}/logo.png`,
	description: 'Connecting communities with trusted local service providers.',
	foundingDate: '2023',
};

const aboutPageJsonLd = {
	'@context': 'https://schema.org',
	'@type': 'AboutPage',
	name: 'About Local Service Marketplace',
	url: `${SITE_URL}/about`,
	description: 'Learn about Local Service Marketplace — our mission, team, and how we connect local service providers with customers.',
	isPartOf: { '@type': 'WebSite', name: 'Local Service Marketplace', url: SITE_URL },
};

const breadcrumbJsonLd = {
	'@context': 'https://schema.org',
	'@type': 'BreadcrumbList',
	itemListElement: [
		{ '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
		{ '@type': 'ListItem', position: 2, name: 'About Us', item: `${SITE_URL}/about` },
	],
};

export default function AboutPage() {
  return (
    <Layout>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutPageJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <div className="bg-white dark:bg-gray-900">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">About Us</h1>
            <p className="text-xl text-primary-100">
              Connecting communities with trusted local service providers
            </p>
          </div>
        </div>

        {/* Mission Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Our Mission
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">
                We believe in empowering local communities by making it easy to find and hire
                trusted service providers. Our platform connects homeowners and businesses with
                skilled professionals for everything from home repairs to personal services.
              </p>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                We're committed to building a marketplace that values quality, transparency,
                and trust - where both customers and service providers can thrive.
              </p>
            </div>
            <div className="bg-primary-50 dark:bg-primary-900/20 p-8 rounded-lg">
              <div className="space-y-6">
                <div className="flex items-start">
                  <Target className="w-8 h-8 text-primary-600 dark:text-primary-400 mr-4 flex-shrink-0" />
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      Our Vision
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      To become the most trusted local service marketplace globally
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Heart className="w-8 h-8 text-primary-600 dark:text-primary-400 mr-4 flex-shrink-0" />
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      Our Values
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Trust, quality, community, and exceptional service
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-gray-50 dark:bg-gray-800 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">
                  10K+
                </div>
                <div className="text-gray-600 dark:text-gray-300">Service Providers</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">
                  50K+
                </div>
                <div className="text-gray-600 dark:text-gray-300">Happy Customers</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">
                  100K+
                </div>
                <div className="text-gray-600 dark:text-gray-300">Jobs Completed</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">
                  4.8/5
                </div>
                <div className="text-gray-600 dark:text-gray-300">Average Rating</div>
              </div>
            </div>
          </div>
        </div>

        {/* Team Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-12 text-center">
            Why Choose Us
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full mb-4">
                <Award className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Verified Professionals
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                All service providers are thoroughly vetted and verified for your peace of mind
              </p>
            </div>
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full mb-4">
                <Users className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Community Driven
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Real reviews from real customers help you make informed decisions
              </p>
            </div>
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full mb-4">
                <Heart className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Quality Guarantee
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                We stand behind every job with our satisfaction guarantee
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-primary-600 dark:bg-primary-700 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-xl text-primary-100 mb-8">
              Join thousands of satisfied customers and providers today
            </p>
            <div className="flex justify-center gap-4">
              <a
                href="/signup"
                className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-primary-50 transition"
              >
                Sign Up
              </a>
              <a
                href="/how-it-works"
                className="bg-primary-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-800 transition border-2 border-white"
              >
                Learn More
              </a>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
