import type { Metadata } from 'next';
import Link from 'next/link';
import { Layout } from '@/components/layout/Layout';
import { Cookie, Settings, Eye, AlertCircle } from 'lucide-react';

export const metadata: Metadata = {
	title: 'Cookie Policy',
	description:
		'Learn how Local Service Marketplace uses cookies to improve your experience and what choices you have.',
	alternates: { canonical: '/cookies' },
	openGraph: {
		title: 'Cookie Policy',
		description:
			'Learn how Local Service Marketplace uses cookies to improve your experience and what choices you have.',
		url: '/cookies',
		images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Local Service Marketplace' }],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Cookie Policy',
		description:
			'Learn how Local Service Marketplace uses cookies to improve your experience and what choices you have.',
	},
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://localservicemarketplace.com';

const cookiesJsonLd = {
	'@context': 'https://schema.org',
	'@type': 'WebPage',
	name: 'Cookie Policy — Local Service Marketplace',
	url: `${SITE_URL}/cookies`,
	description: 'Learn how Local Service Marketplace uses cookies to improve your experience.',
	isPartOf: { '@type': 'WebSite', name: 'Local Service Marketplace', url: SITE_URL },
};

export default function CookiesPage() {
  return (
    <Layout>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(cookiesJsonLd) }} />
      <div className="bg-white dark:bg-gray-900">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Cookie Policy</h1>
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
                <Cookie className="w-6 h-6 text-primary-600 dark:text-primary-400 mr-3 flex-shrink-0 mt-1" />
                <div>
                  <p className="text-gray-700 dark:text-gray-300 mb-0">
                    This Cookie Policy explains how Local Service Marketplace uses cookies and
                    similar tracking technologies when you visit our website. For more information
                    about how we handle your data, please see our{' '}
                    <Link href="/privacy" className="text-primary-600 dark:text-primary-400 hover:underline">
                      Privacy Policy
                    </Link>
                    {' '}and{' '}
                    <Link href="/terms" className="text-primary-600 dark:text-primary-400 hover:underline">
                      Terms of Service
                    </Link>
                    .
                  </p>
                </div>
              </div>
            </div>

            {/* What Are Cookies */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                What Are Cookies?
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Cookies are small text files that are placed on your device when you visit a website.
                They are widely used to make websites work more efficiently and provide information
                to website owners.
              </p>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Cookies can be "persistent" or "session" cookies. Persistent cookies remain on your
                device after you close your browser, while session cookies are deleted when you close
                your browser.
              </p>
            </section>

            {/* Types of Cookies */}
            <section className="mb-12">
              <div className="flex items-center mb-4">
                <Settings className="w-6 h-6 text-primary-600 dark:text-primary-400 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-0">
                  Types of Cookies We Use
                </h2>
              </div>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-6 mb-3">
                1. Essential Cookies
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                These cookies are necessary for the website to function properly. They enable basic
                functions like page navigation, access to secure areas, and authentication.
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 p-4 mb-6">
                <div className="flex">
                  <AlertCircle className="w-5 h-5 text-blue-400 mr-3 flex-shrink-0" />
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-0">
                    Essential cookies cannot be disabled as they are necessary for the website to
                    work.
                  </p>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                <strong>Examples:</strong>
              </p>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2 mb-6">
                <li>Session ID cookies</li>
                <li>Authentication cookies</li>
                <li>Security cookies</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-6 mb-3">
                2. Performance Cookies
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                These cookies collect information about how visitors use our website, such as which
                pages are most popular. This helps us improve how our website works.
              </p>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                <strong>Examples:</strong>
              </p>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2 mb-6">
                <li>Google Analytics cookies</li>
                <li>Page view tracking</li>
                <li>Error reporting cookies</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-6 mb-3">
                3. Functionality Cookies
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                These cookies allow the website to remember choices you make (such as your username,
                language, or theme preference) and provide enhanced, more personalized features.
              </p>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                <strong>Examples:</strong>
              </p>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2 mb-6">
                <li>Language preference cookies</li>
                <li>Theme selection (dark/light mode)</li>
                <li>User preferences</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-6 mb-3">
                4. Targeting/Advertising Cookies
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                These cookies may be set through our site by our advertising partners. They may be
                used to build a profile of your interests and show you relevant advertisements on
                other sites.
              </p>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                <strong>Examples:</strong>
              </p>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2 mb-6">
                <li>Retargeting cookies</li>
                <li>Social media cookies</li>
                <li>Ad network cookies</li>
              </ul>
            </section>

            {/* Third-Party Cookies */}
            <section className="mb-12">
              <div className="flex items-center mb-4">
                <Eye className="w-6 h-6 text-primary-600 dark:text-primary-400 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-0">
                  Third-Party Cookies
                </h2>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Some cookies on our website are placed by third-party services that appear on our
                pages. We use the following third-party services:
              </p>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2 mb-6">
                <li>
                  <strong>Google Analytics:</strong> For website analytics and performance tracking
                </li>
                <li>
                  <strong>Stripe:</strong> For secure payment processing
                </li>
                <li>
                  <strong>Social Media Platforms:</strong> For social sharing and login features
                </li>
              </ul>
            </section>

            {/* How to Control Cookies */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                How to Control Cookies
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                You have the right to decide whether to accept or reject cookies. You can exercise
                your cookie preferences by:
              </p>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2 mb-6">
                <li>
                  <strong>Browser Settings:</strong> Most web browsers allow you to control cookies
                  through their settings. To find out more about cookies, including how to see what
                  cookies have been set and how to manage and delete them, visit{' '}
                  <a
                    href="https://www.aboutcookies.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    www.aboutcookies.org
                  </a>
                  .
                </li>
                <li>
                  <strong>Cookie Consent Tool:</strong> You can manage your cookie preferences using
                  our cookie consent tool that appears when you first visit our website.
                </li>
              </ul>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 mb-6">
                <div className="flex">
                  <AlertCircle className="w-5 h-5 text-yellow-400 mr-3 flex-shrink-0" />
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-0">
                    Please note that if you disable cookies, some features of our website may not
                    function properly.
                  </p>
                </div>
              </div>
            </section>

            {/* Browser-Specific Instructions */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Browser-Specific Cookie Settings
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Here's how to manage cookies in popular browsers:
              </p>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2 mb-6">
                <li>
                  <strong>Chrome:</strong> Settings → Privacy and security → Cookies and other site
                  data
                </li>
                <li>
                  <strong>Firefox:</strong> Settings → Privacy & Security → Cookies and Site Data
                </li>
                <li>
                  <strong>Safari:</strong> Preferences → Privacy → Manage Website Data
                </li>
                <li>
                  <strong>Edge:</strong> Settings → Cookies and site permissions → Cookies and site
                  data
                </li>
              </ul>
            </section>

            {/* Do Not Track */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Do Not Track Signals
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Some browsers include a "Do Not Track" (DNT) feature that signals to websites that
                you do not want your online activity tracked. Currently, there is no uniform
                standard for how DNT signals should be interpreted. We do not currently respond to
                DNT signals.
              </p>
            </section>

            {/* Changes to This Policy */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Changes to This Cookie Policy
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                We may update this Cookie Policy from time to time to reflect changes in our
                practices or for other operational, legal, or regulatory reasons. Please review this
                policy periodically for updates.
              </p>
            </section>

            {/* Contact */}
            <section className="bg-primary-50 dark:bg-primary-900/20 p-6 rounded-lg">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Contact Us
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                If you have any questions about our use of cookies, please contact us:
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
