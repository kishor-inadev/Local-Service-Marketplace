import type { Metadata } from 'next';
import { Layout } from '@/components/layout/Layout';
import { Briefcase, Users, TrendingUp, Heart, Globe, Award } from 'lucide-react';

export const metadata: Metadata = {
	title: 'Careers',
	description:
		'Join the Local Service Marketplace team. View open positions and help connect communities with trusted local service providers.',
	alternates: { canonical: '/careers' },
	openGraph: {
		title: 'Careers at Local Service Marketplace',
		description:
			'Join the Local Service Marketplace team. View open positions and help connect communities with trusted local service providers.',
		url: '/careers',
		images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Local Service Marketplace' }],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Careers at Local Service Marketplace',
		description:
			'Join the Local Service Marketplace team. View open positions and help connect communities with trusted local service providers.',
	},
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://localservicemarketplace.com';

const careersJsonLd = {
	'@context': 'https://schema.org',
	'@type': 'ItemList',
	name: 'Open Positions at Local Service Marketplace',
	url: `${SITE_URL}/careers`,
	itemListElement: [
		{
			'@type': 'JobPosting',
			title: 'Senior Full Stack Developer',
			hiringOrganization: { '@type': 'Organization', name: 'Local Service Marketplace', sameAs: SITE_URL },
			jobLocation: { '@type': 'Place', address: { '@type': 'PostalAddress', addressLocality: 'Remote' } },
			employmentType: 'FULL_TIME',
			datePosted: '2024-01-01',
			description: 'Build and scale our microservices platform using NestJS, Next.js, and PostgreSQL.',
		},
		{
			'@type': 'JobPosting',
			title: 'Product Manager',
			hiringOrganization: { '@type': 'Organization', name: 'Local Service Marketplace', sameAs: SITE_URL },
			jobLocation: { '@type': 'Place', address: { '@type': 'PostalAddress', addressLocality: 'New York', addressRegion: 'NY' } },
			employmentType: 'FULL_TIME',
			datePosted: '2024-01-01',
			description: 'Lead product strategy and roadmap for our local services marketplace platform.',
		},
		{
			'@type': 'JobPosting',
			title: 'Customer Success Manager',
			hiringOrganization: { '@type': 'Organization', name: 'Local Service Marketplace', sameAs: SITE_URL },
			jobLocation: { '@type': 'Place', address: { '@type': 'PostalAddress', addressLocality: 'Remote' } },
			employmentType: 'FULL_TIME',
			datePosted: '2024-01-01',
			description: 'Help customers and service providers succeed on the Local Service Marketplace platform.',
		},
		{
			'@type': 'JobPosting',
			title: 'Marketing Specialist',
			hiringOrganization: { '@type': 'Organization', name: 'Local Service Marketplace', sameAs: SITE_URL },
			jobLocation: { '@type': 'Place', address: { '@type': 'PostalAddress', addressLocality: 'San Francisco', addressRegion: 'CA' } },
			employmentType: 'FULL_TIME',
			datePosted: '2024-01-01',
			description: 'Drive user acquisition and brand awareness for our marketplace platform.',
		},
	],
};

export default function CareersPage() {
  const jobOpenings = [
    {
      title: 'Senior Full Stack Developer',
      department: 'Engineering',
      location: 'Remote',
      type: 'Full-time',
    },
    {
      title: 'Product Manager',
      department: 'Product',
      location: 'New York, NY',
      type: 'Full-time',
    },
    {
      title: 'Customer Success Manager',
      department: 'Customer Success',
      location: 'Remote',
      type: 'Full-time',
    },
    {
      title: 'Marketing Specialist',
      department: 'Marketing',
      location: 'San Francisco, CA',
      type: 'Full-time',
    },
  ];

  return (
    <Layout>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(careersJsonLd) }} />
      <div className="bg-white dark:bg-gray-900">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Join Our Team</h1>
            <p className="text-xl text-primary-100">
              Help us build the future of local services
            </p>
          </div>
        </div>

        {/* Why Work With Us */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Why Work With Us
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              We're building something special, and we want you to be part of it
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full mb-4">
                <TrendingUp className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Growth Opportunities
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Continuous learning and career development programs
              </p>
            </div>

            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full mb-4">
                <Users className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Amazing Team
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Work with talented, passionate people who care
              </p>
            </div>

            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full mb-4">
                <Heart className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Work-Life Balance
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Flexible schedules and generous time off policies
              </p>
            </div>

            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full mb-4">
                <Globe className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Remote First
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Work from anywhere with a strong remote culture
              </p>
            </div>

            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full mb-4">
                <Award className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Competitive Benefits
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Health, dental, vision, 401k, and more
              </p>
            </div>

            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full mb-4">
                <Briefcase className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Meaningful Work
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Make a real impact on local communities
              </p>
            </div>
          </div>
        </div>

        {/* Open Positions */}
        <div className="bg-gray-50 dark:bg-gray-800 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Open Positions
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Find your next opportunity
              </p>
            </div>

            <div className="space-y-4">
              {jobOpenings.map((job, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm hover:shadow-md transition"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="mb-4 md:mb-0">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        {job.title}
                      </h3>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span className="flex items-center">
                          <Briefcase className="w-4 h-4 mr-1" />
                          {job.department}
                        </span>
                        <span className="flex items-center">
                          <Globe className="w-4 h-4 mr-1" />
                          {job.location}
                        </span>
                        <span className="bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 px-3 py-1 rounded-full">
                          {job.type}
                        </span>
                      </div>
                    </div>
                    <a
                      href={`/contact?subject=${encodeURIComponent(`Job Application - ${job.title}`)}`}
                      className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-semibold transition whitespace-nowrap"
                    >
                      Apply Now
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {jobOpenings.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-600 dark:text-gray-400 text-lg mb-4">
                  No open positions at the moment
                </p>
                <p className="text-gray-500 dark:text-gray-500">
                  Check back soon or send us your resume to be considered for future opportunities
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Culture */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Our Culture
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">
                We foster an inclusive, collaborative environment where everyone's voice matters.
                Our team is passionate about making a difference in local communities while
                building innovative technology.
              </p>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">
                We value transparency, continuous learning, and work-life balance. Whether you're
                working remotely or in one of our offices, you'll be part of a supportive team
                that celebrates wins together.
              </p>
            </div>
            <div className="bg-primary-50 dark:bg-primary-900/20 p-8 rounded-lg">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Our Values
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="text-primary-600 dark:text-primary-400 mr-2">✓</span>
                  <span className="text-gray-600 dark:text-gray-300">
                    Customer obsession - we put users first
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 dark:text-primary-400 mr-2">✓</span>
                  <span className="text-gray-600 dark:text-gray-300">
                    Innovation - we challenge the status quo
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 dark:text-primary-400 mr-2">✓</span>
                  <span className="text-gray-600 dark:text-gray-300">
                    Integrity - we do what's right, always
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 dark:text-primary-400 mr-2">✓</span>
                  <span className="text-gray-600 dark:text-gray-300">
                    Collaboration - we win as a team
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 dark:text-primary-400 mr-2">✓</span>
                  <span className="text-gray-600 dark:text-gray-300">
                    Diversity - we celebrate different perspectives
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-primary-600 dark:bg-primary-700 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Don't See the Right Role?</h2>
            <p className="text-xl text-primary-100 mb-8">
              We're always looking for talented people. Send us your resume!
            </p>
            <a
              href="/contact"
              className="inline-block bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-primary-50 transition"
            >
              Get in Touch
            </a>
          </div>
        </div>
      </div>
    </Layout>
  );
}
