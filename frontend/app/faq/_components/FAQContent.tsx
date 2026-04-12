'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';

interface FAQItem {
	question: string;
	answer: string;
	category: string;
}

const faqs: FAQItem[] = [
	{
		category: 'General',
		question: 'What is Local Service Marketplace?',
		answer:
			'Local Service Marketplace is a platform that connects customers with local service providers. Whether you need home repairs, personal services, or professional help, we make it easy to find trusted providers in your area.',
	},
	{
		category: 'General',
		question: 'Is it free to use?',
		answer:
			'Creating an account and browsing providers is completely free. Customers pay only for the services they hire. Service providers pay a small commission on completed jobs.',
	},
	{
		category: 'General',
		question: 'How do I get started?',
		answer:
			'Simply sign up for an account, complete your profile, and you can start browsing providers or posting service requests right away. The process takes just a few minutes.',
	},
	{
		category: 'For Customers',
		question: 'How do I post a service request?',
		answer:
			'After logging in, click on "Post Request" from your dashboard. Describe the service you need, set your budget, and add any relevant details. Providers will then submit proposals for your review.',
	},
	{
		category: 'For Customers',
		question: 'How do I choose the right provider?',
		answer:
			'Review provider profiles, ratings, and reviews from other customers. Compare proposals, ask questions through our messaging system, and select the provider that best fits your needs and budget.',
	},
	{
		category: 'For Customers',
		question: 'How do payments work?',
		answer:
			'Payments are processed securely through our platform. When you hire a provider, payment is held in escrow and released when the job is completed to your satisfaction. This protects both you and the provider.',
	},
	{
		category: 'For Customers',
		question: "What if I'm not satisfied with the work?",
		answer:
			"If you're not satisfied, contact the provider first to resolve the issue. If that doesn't work, you can open a dispute through our platform. Our support team will review the case and help mediate a fair resolution.",
	},
	{
		category: 'For Providers',
		question: 'How do I become a service provider?',
		answer:
			'Sign up for an account, complete the provider verification process (including background check and credential verification), create your professional profile, and start browsing requests that match your skills.',
	},
	{
		category: 'For Providers',
		question: 'How do I get paid?',
		answer:
			'When a job is marked as complete and approved by the customer, payment is processed automatically. Funds are transferred to your bank account within 3-5 business days.',
	},
	{
		category: 'For Providers',
		question: 'What fees do providers pay?',
		answer:
			'Providers pay a commission of 10-15% (depending on your subscription tier) on completed jobs. There are no upfront fees or monthly charges for basic provider accounts.',
	},
	{
		category: 'For Providers',
		question: 'How can I get more visibility?',
		answer:
			'Complete your profile fully, respond quickly to requests, maintain high ratings, collect positive reviews, and consider upgrading to a premium provider account for enhanced visibility.',
	},
	{
		category: 'Safety & Trust',
		question: 'Are service providers verified?',
		answer:
			'Yes, all service providers go through a verification process that includes identity verification, background checks, and credential verification where applicable.',
	},
	{
		category: 'Safety & Trust',
		question: 'Is my payment information secure?',
		answer:
			'Absolutely. We use industry-standard encryption and work with trusted payment processors. We never store your full payment details on our servers.',
	},
	{
		category: 'Safety & Trust',
		question: 'What should I do if I encounter a problem?',
		answer:
			'Contact our support team immediately through the Help Center or by emailing support@localservicemarketplace.com. We take all reports seriously and will investigate promptly.',
	},
	{
		category: 'Account',
		question: 'How do I reset my password?',
		answer:
			"Click \"Forgot Password\" on the login page, enter your email address, and we'll send you a link to reset your password. The link expires after 1 hour for security.",
	},
	{
		category: 'Account',
		question: 'Can I delete my account?',
		answer:
			'Yes, you can delete your account from Settings > Account Settings > Delete Account. Please note this action is permanent and cannot be undone.',
	},
	{
		category: 'Account',
		question: 'How do I change my notification settings?',
		answer:
			'Go to Settings > Notifications to customize which notifications you receive via email, SMS, and push notifications.',
	},
];

const categories = ['All', ...Array.from(new Set(faqs.map((faq) => faq.category)))];

export function FAQContent() {
	const [openIndex, setOpenIndex] = useState<number | null>(null);
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedCategory, setSelectedCategory] = useState('All');

	const filteredFAQs = faqs.filter((faq) => {
		const matchesSearch =
			faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
			faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
		const matchesCategory = selectedCategory === 'All' || faq.category === selectedCategory;
		return matchesSearch && matchesCategory;
	});

	const toggleFAQ = (index: number) => {
		setOpenIndex(openIndex === index ? null : index);
	};

	return (
		<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
			{/* Search Bar */}
			<div className="mb-8">
				<div className="relative">
					<Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
					<input
						type="text"
						placeholder="Search FAQs..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
					/>
				</div>
			</div>

			{/* Category Filter */}
			<div className="flex flex-wrap gap-2 mb-8">
				{categories.map((category) => (
					<button
						key={category}
						onClick={() => setSelectedCategory(category)}
						className={`px-4 py-2 rounded-lg font-medium transition ${
							selectedCategory === category
								? 'bg-primary-600 text-white'
								: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
						}`}
					>
						{category}
					</button>
				))}
			</div>

			{/* FAQ List */}
			<div className="space-y-4">
				{filteredFAQs.length > 0 ? (
					filteredFAQs.map((faq, index) => (
						<div
							key={index}
							className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
						>
							<button
								onClick={() => toggleFAQ(index)}
								className="w-full px-6 py-4 text-left bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 transition flex justify-between items-center"
							>
								<div>
									<span className="text-xs font-semibold text-primary-600 dark:text-primary-400 mb-1 block">
										{faq.category}
									</span>
									<span className="text-lg font-semibold text-gray-900 dark:text-white">
										{faq.question}
									</span>
								</div>
								{openIndex === index ? (
									<ChevronUp className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0 ml-4" />
								) : (
									<ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0 ml-4" />
								)}
							</button>
							{openIndex === index && (
								<div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
									<p className="text-gray-600 dark:text-gray-300">{faq.answer}</p>
								</div>
							)}
						</div>
					))
				) : (
					<div className="text-center py-12">
						<p className="text-gray-600 dark:text-gray-400 text-lg">
							No FAQs found matching your search.
						</p>
					</div>
				)}
			</div>

			{/* Contact CTA */}
			<div className="mt-12 bg-primary-50 dark:bg-primary-900/20 rounded-lg p-8 text-center">
				<h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
					Still have questions?
				</h2>
				<p className="text-gray-600 dark:text-gray-300 mb-6">
					Can&apos;t find the answer you&apos;re looking for? Our support team is here to help.
				</p>
				<a
					href="/contact"
					className="inline-block bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-semibold transition"
				>
					Contact Support
				</a>
			</div>
		</div>
	);
}
