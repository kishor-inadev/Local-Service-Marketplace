import type { Metadata } from 'next';
import Link from 'next/link';
import { Layout } from '@/components/layout/Layout';
import { Shield, Lock, Eye, Database, UserCheck, AlertCircle } from 'lucide-react';

export const metadata: Metadata = {
	title: 'Privacy Policy',
	description:
		'Read our privacy policy — how we collect, use, and protect your personal information on Local Service Marketplace.',
	alternates: { canonical: '/privacy' },
	openGraph: {
		title: 'Privacy Policy',
		description:
			'Read our privacy policy — how we collect, use, and protect your personal information on Local Service Marketplace.',
		url: '/privacy',
		images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Local Service Marketplace' }],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Privacy Policy',
		description:
			'Read our privacy policy — how we collect, use, and protect your personal information on Local Service Marketplace.',
	},
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://localservicemarketplace.com';

const privacyJsonLd = {
	'@context': 'https://schema.org',
	'@type': 'WebPage',
	name: 'Privacy Policy — Local Service Marketplace',
	url: `${SITE_URL}/privacy`,
	description: 'Read our privacy policy — how we collect, use, and protect your personal information.',
	isPartOf: { '@type': 'WebSite', name: 'Local Service Marketplace', url: SITE_URL },
};

export default function PrivacyPage() {
  return (
    <Layout>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(privacyJsonLd) }} />
      <div className="bg-white dark:bg-gray-900">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-xl text-primary-100">
              Last updated: March 14, 2026
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Introduction */}
          <div className="prose dark:prose-invert max-w-none">
            <div className="bg-primary-50 dark:bg-primary-900/20 p-6 rounded-lg mb-8">
              <div className="flex items-start">
                <Shield className="w-6 h-6 text-primary-600 dark:text-primary-400 mr-3 flex-shrink-0 mt-1" />
                <div>
                  <p className="text-gray-700 dark:text-gray-300 mb-0">
                    At Local Service Marketplace, we take your privacy seriously. This Privacy Policy
                    explains how we collect, use, disclose, and safeguard your information when you
                    use our platform.
                  </p>
                </div>
              </div>
            </div>

            {/* Information We Collect */}
            <section className="mb-12">
              <div className="flex items-center mb-4">
                <Database className="w-6 h-6 text-primary-600 dark:text-primary-400 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-0">
                  Information We Collect
                </h2>
              </div>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-6 mb-3">
                Personal Information
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                We collect information that you provide directly to us, including:
              </p>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2 mb-6">
                <li>Name, email address, phone number, and postal address</li>
                <li>Profile information (photo, bio, skills, certifications)</li>
                <li>Payment information (processed securely through third-party providers)</li>
                <li>Communications with other users and customer support</li>
                <li>Reviews, ratings, and feedback</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-6 mb-3">
                Automatically Collected Information
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                When you use our platform, we automatically collect:
              </p>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2 mb-6">
                <li>Device information (IP address, browser type, operating system)</li>
                <li>Usage data (pages viewed, time spent, interactions)</li>
                <li>Location data (with your permission)</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </section>

            {/* How We Use Your Information */}
            <section className="mb-12">
              <div className="flex items-center mb-4">
                <UserCheck className="w-6 h-6 text-primary-600 dark:text-primary-400 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-0">
                  How We Use Your Information
                </h2>
              </div>

              <p className="text-gray-600 dark:text-gray-300 mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2 mb-6">
                <li>Provide, maintain, and improve our services</li>
                <li>Process transactions and send related information</li>
                <li>Send you technical notices, updates, and support messages</li>
                <li>Respond to your comments, questions, and customer service requests</li>
                <li>Communicate with you about products, services, and promotional offers</li>
                <li>Monitor and analyze trends, usage, and activities</li>
                <li>Detect, prevent, and address fraud and security issues</li>
                <li>Personalize your experience and provide relevant content</li>
              </ul>
            </section>

            {/* Information Sharing */}
            <section className="mb-12">
              <div className="flex items-center mb-4">
                <Eye className="w-6 h-6 text-primary-600 dark:text-primary-400 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-0">
                  Information Sharing and Disclosure
                </h2>
              </div>

              <p className="text-gray-600 dark:text-gray-300 mb-4">
                We may share your information in the following situations:
              </p>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2 mb-6">
                <li>
                  <strong>With Other Users:</strong> Your profile information and reviews are visible
                  to other users
                </li>
                <li>
                  <strong>With Service Providers:</strong> We may share information with third-party
                  vendors who perform services on our behalf
                </li>
                <li>
                  <strong>For Legal Reasons:</strong> We may disclose information if required by law
                  or in response to valid legal requests
                </li>
                <li>
                  <strong>Business Transfers:</strong> If we are involved in a merger, acquisition,
                  or sale of assets
                </li>
                <li>
                  <strong>With Your Consent:</strong> We may share information when you give us
                  explicit permission
                </li>
              </ul>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 mb-6">
                <div className="flex">
                  <AlertCircle className="w-5 h-5 text-yellow-400 mr-3 flex-shrink-0" />
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-0">
                    We never sell your personal information to third parties.
                  </p>
                </div>
              </div>
            </section>

            {/* Data Security */}
            <section className="mb-12">
              <div className="flex items-center mb-4">
                <Lock className="w-6 h-6 text-primary-600 dark:text-primary-400 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-0">
                  Data Security
                </h2>
              </div>

              <p className="text-gray-600 dark:text-gray-300 mb-4">
                We implement appropriate technical and organizational measures to protect your
                personal information against unauthorized access, alteration, disclosure, or
                destruction. These measures include:
              </p>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2 mb-6">
                <li>Encryption of data in transit and at rest</li>
                <li>Regular security assessments and audits</li>
                <li>Access controls and authentication requirements</li>
                <li>Secure payment processing through PCI-compliant providers</li>
                <li>Employee training on data protection and privacy</li>
              </ul>
            </section>

            {/* Your Rights */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Your Rights and Choices
              </h2>

              <p className="text-gray-600 dark:text-gray-300 mb-4">
                You have the following rights regarding your personal information:
              </p>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2 mb-6">
                <li>
                  <strong>Access:</strong> Request a copy of your personal information
                </li>
                <li>
                  <strong>Correction:</strong> Update or correct inaccurate information
                </li>
                <li>
                  <strong>Deletion:</strong> Request deletion of your account and data
                </li>
                <li>
                  <strong>Opt-Out:</strong> Unsubscribe from marketing communications
                </li>
                <li>
                  <strong>Data Portability:</strong> Request your data in a portable format
                </li>
              </ul>

              <p className="text-gray-600 dark:text-gray-300 mb-4">
                To exercise these rights, please contact us at privacy@localservicemarketplace.com
              </p>
            </section>

            {/* Cookies */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Cookies and Tracking Technologies
              </h2>

              <p className="text-gray-600 dark:text-gray-300 mb-4">
                We use cookies and similar tracking technologies to track activity on our platform
                and store certain information. You can instruct your browser to refuse all cookies
                or to indicate when a cookie is being sent.
              </p>

              <p className="text-gray-600 dark:text-gray-300 mb-4">
                For more information about cookies, please see our{' '}
                <Link href="/cookies" className="text-primary-600 dark:text-primary-400 hover:underline">
                  Cookie Policy
                </Link>
                . You can also review our{' '}
                <Link href="/terms" className="text-primary-600 dark:text-primary-400 hover:underline">
                  Terms of Service
                </Link>
                .
              </p>
            </section>

            {/* Children's Privacy */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Children's Privacy
              </h2>

              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Our services are not intended for individuals under the age of 18. We do not
                knowingly collect personal information from children. If you are a parent or guardian
                and believe your child has provided us with personal information, please contact us.
              </p>
            </section>

            {/* Changes to Policy */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Changes to This Privacy Policy
              </h2>

              <p className="text-gray-600 dark:text-gray-300 mb-4">
                We may update our Privacy Policy from time to time. We will notify you of any
                changes by posting the new Privacy Policy on this page and updating the "Last
                updated" date.
              </p>
            </section>

            {/* Contact Us */}
            <section className="bg-primary-50 dark:bg-primary-900/20 p-6 rounded-lg">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Contact Us
              </h2>

              <p className="text-gray-600 dark:text-gray-300 mb-4">
                If you have any questions about this Privacy Policy, please contact us:
              </p>
              <ul className="text-gray-600 dark:text-gray-300 space-y-2">
                <li>Email: privacy@localservicemarketplace.com</li>
                <li>Phone: +1 (234) 567-890</li>
                <li>Address: 123 Service Street, San Francisco, CA 94102</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
}
