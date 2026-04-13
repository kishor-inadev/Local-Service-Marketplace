import type { Metadata } from 'next';
import Link from 'next/link';
import { Layout } from '@/components/layout/Layout';
import { FileText, AlertCircle, Shield, Scale } from 'lucide-react';

export const metadata: Metadata = {
	title: 'Terms of Service',
	description:
		'Review the terms of service for Local Service Marketplace — rules, policies, and legal agreements for using our platform.',
	alternates: { canonical: '/terms' },
	openGraph: {
		title: 'Terms of Service',
		description:
			'Review the terms of service for Local Service Marketplace — rules, policies, and legal agreements for using our platform.',
		url: '/terms',
		images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Local Service Marketplace' }],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Terms of Service',
		description:
			'Review the terms of service for Local Service Marketplace — rules, policies, and legal agreements for using our platform.',
	},
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://localservicemarketplace.com';

const termsJsonLd = {
	'@context': 'https://schema.org',
	'@type': 'WebPage',
	name: 'Terms of Service — Local Service Marketplace',
	url: `${SITE_URL}/terms`,
	description: 'Review the terms of service for Local Service Marketplace — rules, policies, and legal agreements.',
	isPartOf: { '@type': 'WebSite', name: 'Local Service Marketplace', url: SITE_URL },
};

export default function TermsPage() {
  return (
    <Layout>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(termsJsonLd) }} />
      <div className="bg-white dark:bg-gray-900">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Terms of Service</h1>
            <p className="text-xl text-primary-100">
              Last updated: March 14, 2026
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="prose dark:prose-invert max-w-none">
            {/* Introduction */}
            <div className="bg-primary-50 dark:bg-primary-900/20 p-6 rounded-lg mb-8">
              <div className="flex items-start">
                <FileText className="w-6 h-6 text-primary-600 dark:text-primary-400 mr-3 flex-shrink-0 mt-1" />
                <div>
                  <p className="text-gray-700 dark:text-gray-300 mb-0">
                    Please read these Terms of Service carefully before using Local Service
                    Marketplace. By accessing or using our platform, you agree to be bound by these
                    terms and our{' '}
                    <Link href="/privacy" className="text-primary-600 dark:text-primary-400 hover:underline">
                      Privacy Policy
                    </Link>
                    .
                  </p>
                </div>
              </div>
            </div>

            {/* Acceptance of Terms */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                1. Acceptance of Terms
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                By creating an account or using our services, you agree to these Terms of Service
                and our{' '}
                <Link href="/privacy" className="text-primary-600 dark:text-primary-400 hover:underline">
                  Privacy Policy
                </Link>
                . If you do not agree to these terms, please do not use our
                platform.
              </p>
            </section>

            {/* Eligibility */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                2. Eligibility
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                You must be at least 18 years old to use our services. By using our platform, you
                represent and warrant that you meet this age requirement and have the legal capacity
                to enter into these terms.
              </p>
            </section>

            {/* Account Registration */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                3. Account Registration and Security
              </h2>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2 mb-4">
                <li>You must provide accurate and complete information when creating an account</li>
                <li>You are responsible for maintaining the confidentiality of your password</li>
                <li>You are responsible for all activities that occur under your account</li>
                <li>You must notify us immediately of any unauthorized use of your account</li>
                <li>We reserve the right to suspend or terminate accounts that violate these terms</li>
              </ul>
            </section>

            {/* User Conduct */}
            <section className="mb-12">
              <div className="flex items-center mb-4">
                <AlertCircle className="w-6 h-6 text-primary-600 dark:text-primary-400 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-0">
                  4. User Conduct
                </h2>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                You agree not to:
              </p>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2 mb-4">
                <li>Violate any applicable laws or regulations</li>
                <li>Post false, misleading, or fraudulent information</li>
                <li>Impersonate another person or entity</li>
                <li>Harass, threaten, or harm other users</li>
                <li>Use the platform for illegal activities</li>
                <li>Attempt to circumvent security features</li>
                <li>Scrape or collect data without permission</li>
                <li>Spam or send unsolicited communications</li>
              </ul>
            </section>

            {/* Service Provider Terms */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                5. Service Provider Responsibilities
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                If you are a service provider, you agree to:
              </p>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2 mb-4">
                <li>Provide accurate information about your qualifications and services</li>
                <li>Complete verification and background check processes</li>
                <li>Provide services in a professional and timely manner</li>
                <li>Maintain necessary licenses, insurance, and certifications</li>
                <li>Communicate clearly with customers</li>
                <li>Pay applicable fees and commissions</li>
                <li>Comply with all applicable laws and regulations</li>
              </ul>
            </section>

            {/* Customer Terms */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                6. Customer Responsibilities
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                If you are a customer, you agree to:
              </p>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2 mb-4">
                <li>Provide accurate information about your service needs</li>
                <li>Pay for services as agreed</li>
                <li>Treat service providers with respect</li>
                <li>Provide honest feedback and reviews</li>
                <li>Comply with cancellation policies</li>
              </ul>
            </section>

            {/* Payments and Fees */}
            <section className="mb-12">
              <div className="flex items-center mb-4">
                <Scale className="w-6 h-6 text-primary-600 dark:text-primary-400 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-0">
                  7. Payments and Fees
                </h2>
              </div>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2 mb-4">
                <li>All payments are processed through our secure payment system</li>
                <li>Service providers pay a commission on completed jobs (10-15%)</li>
                <li>Customers pay the agreed-upon service fee plus applicable taxes</li>
                <li>Payments are held in escrow until job completion</li>
                <li>Refunds are subject to our refund policy</li>
                <li>We reserve the right to change our fee structure with notice</li>
              </ul>
            </section>

            {/* Cancellations and Refunds */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                8. Cancellations and Refunds
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Cancellation policies vary by service and provider. Generally:
              </p>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2 mb-4">
                <li>Cancellations made 24+ hours before service may receive full refund</li>
                <li>Late cancellations may incur fees</li>
                <li>No-shows may result in no refund</li>
                <li>Disputes are handled through our dispute resolution process</li>
              </ul>
            </section>

            {/* Intellectual Property */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                9. Intellectual Property
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                All content on our platform, including text, graphics, logos, and software, is the
                property of Local Service Marketplace or our licensors and is protected by copyright
                and other intellectual property laws.
              </p>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                You retain ownership of content you post, but grant us a license to use, display, and
                distribute it on our platform.
              </p>
            </section>

            {/* Disclaimer of Warranties */}
            <section className="mb-12">
              <div className="flex items-center mb-4">
                <Shield className="w-6 h-6 text-primary-600 dark:text-primary-400 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-0">
                  10. Disclaimer of Warranties
                </h2>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 mb-6">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Our platform is provided "as is" without warranties of any kind, either express or
                  implied. We do not guarantee that the platform will be error-free or
                  uninterrupted.
                </p>
              </div>
            </section>

            {/* Limitation of Liability */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                11. Limitation of Liability
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                To the fullest extent permitted by law, Local Service Marketplace shall not be
                liable for any indirect, incidental, special, consequential, or punitive damages
                arising from your use of our platform.
              </p>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                We are not liable for the quality, safety, or legality of services provided by
                service providers.
              </p>
            </section>

            {/* Indemnification */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                12. Indemnification
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                You agree to indemnify and hold harmless Local Service Marketplace from any claims,
                damages, or expenses arising from your use of the platform or violation of these
                terms.
              </p>
            </section>

            {/* Dispute Resolution */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                13. Dispute Resolution
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Any disputes arising from these terms or your use of our platform shall be resolved
                through binding arbitration in accordance with the rules of the American Arbitration
                Association.
              </p>
            </section>

            {/* Termination */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                14. Termination
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                We reserve the right to suspend or terminate your account at any time for violation
                of these terms. You may also terminate your account at any time through your account
                settings.
              </p>
            </section>

            {/* Changes to Terms */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                15. Changes to These Terms
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                We may modify these terms at any time. We will notify you of material changes by
                posting the updated terms on our platform. Your continued use of the platform after
                changes constitutes acceptance of the new terms.
              </p>
            </section>

            {/* Governing Law */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                16. Governing Law
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                These terms are governed by the laws of the State of California, without regard to
                its conflict of law provisions.
              </p>
            </section>

            {/* Contact */}
            <section className="bg-primary-50 dark:bg-primary-900/20 p-6 rounded-lg">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Contact Us
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                If you have any questions about these Terms of Service, please contact us:
              </p>
              <ul className="text-gray-600 dark:text-gray-300 space-y-2">
                <li>Email: legal@localservicemarketplace.com</li>
                <li>Phone: +91 80456 78900 (Mon–Fri, 10 AM–6 PM IST)</li>
                <li>Address: Local Service Marketplace Pvt. Ltd., 4th Floor, Tech Park, BKC, Mumbai – 400 051, Maharashtra, India</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
}
