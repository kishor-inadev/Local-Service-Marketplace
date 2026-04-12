'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';
import { faqs } from '../_data/faqs';

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
