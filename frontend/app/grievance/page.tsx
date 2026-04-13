import type { Metadata } from 'next';
import Link from 'next/link';
import { Layout } from '@/components/layout/Layout';
import { ShieldAlert, Mail, Phone, MapPin, Clock, FileText, AlertCircle, CheckCircle } from 'lucide-react';

export const metadata: Metadata = {
	title: 'Grievance Officer',
	description:
		'Contact our Grievance Officer for complaints, data privacy concerns, or platform disputes as required under the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021.',
	alternates: { canonical: '/grievance' },
	openGraph: {
		title: 'Grievance Officer — Local Service Marketplace',
		description:
			'Contact our Grievance Officer for complaints under IT Rules 2021 and the Digital Personal Data Protection Act, 2023.',
		url: '/grievance',
		images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Local Service Marketplace' }],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Grievance Officer — Local Service Marketplace',
		description:
			'Contact our Grievance Officer for complaints under IT Rules 2021 and the Digital Personal Data Protection Act, 2023.',
	},
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://localservicemarketplace.com';

const grievanceJsonLd = {
	'@context': 'https://schema.org',
	'@type': 'WebPage',
	name: 'Grievance Officer — Local Service Marketplace',
	url: `${SITE_URL}/grievance`,
	description:
		'Grievance redressal mechanism under the IT (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021.',
	isPartOf: { '@type': 'WebSite', name: 'Local Service Marketplace', url: SITE_URL },
};

export default function GrievancePage() {
	return (
		<Layout>
			<script type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON.stringify(grievanceJsonLd) }} />
			<div className='bg-white dark:bg-gray-900'>
				{/* Hero */}
				<div className='bg-gradient-to-r from-primary-600 to-primary-800 text-white py-16'>
					<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
						<div className='flex items-center gap-4 mb-4'>
							<ShieldAlert className='h-10 w-10 text-primary-200' />
							<h1 className='text-4xl md:text-5xl font-bold'>Grievance Officer</h1>
						</div>
						<p className='text-xl text-primary-100 max-w-2xl'>
							In compliance with the Information Technology (Intermediary Guidelines and Digital Media Ethics
							Code) Rules, 2021, and the Digital Personal Data Protection Act, 2023.
						</p>
						<p className='mt-3 text-sm text-primary-200'>Last updated: April 13, 2026</p>
					</div>
				</div>

				<div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12'>
					{/* Legal basis notice */}
					<div className='bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-6 flex gap-4'>
						<AlertCircle className='h-6 w-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5' />
						<div>
							<p className='font-semibold text-amber-800 dark:text-amber-300 mb-1'>Mandatory Disclosure</p>
							<p className='text-sm text-amber-700 dark:text-amber-400'>
								Rule 3(2)(b) of the IT (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021,
								requires every intermediary to designate a Grievance Officer and display their name and contact
								details prominently on its website / app. This page fulfils that obligation.
							</p>
						</div>
					</div>

					{/* Grievance Officer Contact Card */}
					<section>
						<h2 className='text-2xl font-bold text-gray-900 dark:text-white mb-6'>Grievance Officer Details</h2>
						<div className='bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8'>
							<p className='text-xl font-semibold text-gray-900 dark:text-white mb-1'>
								{process.env.NEXT_PUBLIC_GRIEVANCE_OFFICER_NAME || 'Rahul Sharma'}
							</p>
							<p className='text-sm text-gray-500 dark:text-gray-400 mb-6'>Grievance Officer &amp; Data Protection Officer</p>

							<div className='grid sm:grid-cols-2 gap-5'>
								<div className='flex items-start gap-3'>
									<Mail className='h-5 w-5 text-primary-500 mt-0.5 flex-shrink-0' />
									<div>
										<p className='text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-0.5'>Email</p>
										<a
											href={`mailto:${process.env.NEXT_PUBLIC_GRIEVANCE_EMAIL || 'grievance@localservicemarketplace.com'}`}
											className='text-primary-600 dark:text-primary-400 hover:underline text-sm font-medium'>
											{process.env.NEXT_PUBLIC_GRIEVANCE_EMAIL || 'grievance@localservicemarketplace.com'}
										</a>
										<p className='text-xs text-gray-400 mt-0.5'>Dedicated grievance inbox — monitored Monday–Friday, 9 AM–6 PM IST</p>
									</div>
								</div>

								<div className='flex items-start gap-3'>
									<Phone className='h-5 w-5 text-primary-500 mt-0.5 flex-shrink-0' />
									<div>
										<p className='text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-0.5'>Phone</p>
										<a
											href={`tel:${process.env.NEXT_PUBLIC_GRIEVANCE_PHONE || '+918045678900'}`}
											className='text-primary-600 dark:text-primary-400 hover:underline text-sm font-medium'>
											{process.env.NEXT_PUBLIC_GRIEVANCE_PHONE || '+91 80456 78900'}
										</a>
										<p className='text-xs text-gray-400 mt-0.5'>Available Monday–Friday, 10 AM–5 PM IST</p>
									</div>
								</div>

								<div className='flex items-start gap-3 sm:col-span-2'>
									<MapPin className='h-5 w-5 text-primary-500 mt-0.5 flex-shrink-0' />
									<div>
										<p className='text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-0.5'>Postal Address</p>
										<address className='not-italic text-sm text-gray-700 dark:text-gray-300'>
											{process.env.NEXT_PUBLIC_COMPANY_ADDRESS || (
												<>
													Local Service Marketplace Private Limited<br />
													Grievance Officer, 4th Floor, Tech Park,<br />
													Bandra Kurla Complex, Bandra East,<br />
													Mumbai – 400 051, Maharashtra, India
												</>
											)}
										</address>
									</div>
								</div>
							</div>
						</div>
					</section>

					{/* Resolution Timeline */}
					<section>
						<h2 className='text-2xl font-bold text-gray-900 dark:text-white mb-6'>Resolution Timeline</h2>
						<div className='grid sm:grid-cols-2 gap-4'>
							{[
								{
									icon: Clock,
									color: 'text-blue-500',
									bg: 'bg-blue-50 dark:bg-blue-900/20',
									title: 'Acknowledgement',
									time: 'Within 24 hours',
									desc: 'We will acknowledge your complaint within 24 hours of receipt and provide a ticket number for tracking.',
								},
								{
									icon: CheckCircle,
									color: 'text-green-500',
									bg: 'bg-green-50 dark:bg-green-900/20',
									title: 'Resolution',
									time: 'Within 15 working days',
									desc: 'We aim to resolve all grievances within 15 working days from the date of receipt, as required by IT Rules 2021.',
								},
							].map(({ icon: Icon, color, bg, title, time, desc }) => (
								<div key={title} className={`rounded-xl p-6 border border-gray-200 dark:border-gray-700 ${bg}`}>
									<div className='flex items-center gap-3 mb-3'>
										<Icon className={`h-6 w-6 ${color}`} />
										<div>
											<p className='font-semibold text-gray-900 dark:text-white'>{title}</p>
											<p className={`text-sm font-medium ${color}`}>{time}</p>
										</div>
									</div>
									<p className='text-sm text-gray-600 dark:text-gray-400'>{desc}</p>
								</div>
							))}
						</div>

						<p className='mt-4 text-sm text-gray-500 dark:text-gray-400'>
							<strong>Note:</strong> Complaints related to removal of content that exposes private sexual material
							will be resolved within 24 hours, as mandated under IT Rules 2021.
						</p>
					</section>

					{/* How to File */}
					<section>
						<h2 className='text-2xl font-bold text-gray-900 dark:text-white mb-2'>How to File a Grievance</h2>
						<p className='text-gray-500 dark:text-gray-400 mb-6'>
							You may submit your grievance through any of the following channels:
						</p>

						<ol className='space-y-5'>
							{[
								{
									step: '1',
									title: 'Submit via Email',
									detail: (
										<>
											Send a detailed email to{' '}
											<a
												href='mailto:grievance@localservicemarketplace.com'
												className='text-primary-600 dark:text-primary-400 hover:underline'>
												grievance@localservicemarketplace.com
											</a>{' '}
											with the subject line: <em>"Grievance — [Your Registered Email]"</em>.
										</>
									),
								},
								{
									step: '2',
									title: 'Contact via Phone',
									detail: 'Call us during business hours. Provide your registered mobile number for verification.',
								},
								{
									step: '3',
									title: 'Send a Written Notice',
									detail: 'You may send a signed grievance letter to our postal address above (registered / speed post recommended for legal purposes).',
								},
							].map(({ step, title, detail }) => (
								<li key={step} className='flex gap-4'>
									<span className='flex-shrink-0 h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 font-bold text-sm flex items-center justify-center'>
										{step}
									</span>
									<div>
										<p className='font-semibold text-gray-900 dark:text-white mb-0.5'>{title}</p>
										<p className='text-sm text-gray-600 dark:text-gray-400'>{detail}</p>
									</div>
								</li>
							))}
						</ol>
					</section>

					{/* What to include */}
					<section>
						<h2 className='text-2xl font-bold text-gray-900 dark:text-white mb-2'>What to Include in Your Complaint</h2>
						<p className='text-sm text-gray-500 dark:text-gray-400 mb-4'>
							To help us resolve your grievance quickly, please include:
						</p>
						<ul className='space-y-2'>
							{[
								'Your full name and registered email address / mobile number',
								'Nature of the complaint (account, transaction, content, data privacy, etc.)',
								'Relevant order / job / payment ID (if applicable)',
								'Description of the issue with relevant dates and screenshots',
								'The relief or remedy you are seeking',
							].map((item) => (
								<li key={item} className='flex items-start gap-3 text-sm text-gray-600 dark:text-gray-300'>
									<CheckCircle className='h-4 w-4 text-green-500 mt-0.5 flex-shrink-0' />
									{item}
								</li>
							))}
						</ul>
					</section>

					{/* Types of Complaints */}
					<section>
						<h2 className='text-2xl font-bold text-gray-900 dark:text-white mb-6'>Types of Complaints Handled</h2>
						<div className='grid sm:grid-cols-2 gap-4'>
							{[
								{ title: 'Account & Access', desc: 'Account suspension, login issues, or unauthorised access to your account.' },
								{ title: 'Transaction Disputes', desc: 'Payment failures, refund delays, escrow disputes, or overcharging.' },
								{ title: 'Provider / Service Quality', desc: 'Fraudulent listings, fake reviews, or poor service delivery.' },
								{ title: 'Personal Data & Privacy', desc: 'Data deletion requests, data breach concerns, or DPDP Act 2023 rights.' },
								{ title: 'Harmful / Illegal Content', desc: 'Requests for removal of content violating IT Rules, obscene material, or defamatory content.' },
								{ title: 'Discrimination & Harassment', desc: 'Platform-facilitated harassment, discriminatory conduct, or hate speech.' },
							].map(({ title, desc }) => (
								<div
									key={title}
									className='flex items-start gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800'>
									<FileText className='h-5 w-5 text-primary-500 mt-0.5 flex-shrink-0' />
									<div>
										<p className='font-semibold text-gray-900 dark:text-white text-sm'>{title}</p>
										<p className='text-xs text-gray-500 dark:text-gray-400 mt-0.5'>{desc}</p>
									</div>
								</div>
							))}
						</div>
					</section>

					{/* DPDP Rights */}
					<section>
						<h2 className='text-2xl font-bold text-gray-900 dark:text-white mb-2'>
							Your Rights under DPDP Act, 2023
						</h2>
						<p className='text-sm text-gray-500 dark:text-gray-400 mb-4'>
							Under the Digital Personal Data Protection Act, 2023 (India), you have the following rights
							regarding your personal data processed by us:
						</p>
						<div className='grid sm:grid-cols-2 gap-3'>
							{[
								{ right: 'Right to Information', desc: 'Know what personal data we hold about you and how it is used.' },
								{ right: 'Right to Correction', desc: 'Request correction of inaccurate or incomplete personal data.' },
								{ right: 'Right to Erasure', desc: 'Request deletion of your personal data (subject to legal exceptions).' },
								{ right: 'Right to Grievance Redressal', desc: 'File a complaint with our Grievance Officer or escalate to the Data Protection Board of India.' },
								{ right: 'Right to Nominate', desc: 'Nominate another individual to exercise your rights in the event of death or incapacity.' },
								{ right: 'Withdrawal of Consent', desc: 'Withdraw consent to process your personal data at any time, subject to lawful requirements.' },
							].map(({ right, desc }) => (
								<div key={right} className='flex items-start gap-3'>
									<CheckCircle className='h-4 w-4 text-primary-500 mt-0.5 flex-shrink-0' />
									<div>
										<p className='text-sm font-semibold text-gray-800 dark:text-gray-200'>{right}</p>
										<p className='text-xs text-gray-500 dark:text-gray-400'>{desc}</p>
									</div>
								</div>
							))}
						</div>
					</section>

					{/* Escalation */}
					<section>
						<h2 className='text-2xl font-bold text-gray-900 dark:text-white mb-2'>Escalation</h2>
						<p className='text-sm text-gray-600 dark:text-gray-400 mb-4'>
							If you are not satisfied with the resolution provided by our Grievance Officer within the stipulated
							time, you may escalate your complaint to:
						</p>
						<div className='space-y-4'>
							<div className='rounded-xl border border-gray-200 dark:border-gray-700 p-5'>
								<p className='font-semibold text-gray-900 dark:text-white mb-1'>Data Protection Board of India</p>
								<p className='text-sm text-gray-500 dark:text-gray-400 mb-2'>
									For personal data-related grievances under the DPDP Act, 2023.
								</p>
								<a
									href='https://www.meity.gov.in'
									target='_blank'
									rel='noopener noreferrer'
									className='text-sm text-primary-600 dark:text-primary-400 hover:underline'>
									Ministry of Electronics and Information Technology (MeitY) →
								</a>
							</div>
							<div className='rounded-xl border border-gray-200 dark:border-gray-700 p-5'>
								<p className='font-semibold text-gray-900 dark:text-white mb-1'>National Consumer Helpline</p>
								<p className='text-sm text-gray-500 dark:text-gray-400 mb-2'>
									For consumer disputes under the Consumer Protection Act, 2019.
								</p>
								<a
									href='https://consumerhelpline.gov.in'
									target='_blank'
									rel='noopener noreferrer'
									className='text-sm text-primary-600 dark:text-primary-400 hover:underline'>
									consumerhelpline.gov.in →
								</a>
								<span className='ml-4 text-sm text-gray-500'>Helpline: 1800-11-4000 or 14404</span>
							</div>
						</div>
					</section>

					{/* Related Links */}
					<div className='bg-primary-50 dark:bg-primary-900/20 rounded-xl p-6 border border-primary-100 dark:border-primary-800'>
						<h3 className='font-semibold text-gray-900 dark:text-white mb-3'>Related Policies</h3>
						<div className='flex flex-wrap gap-4 text-sm'>
							<Link href='/privacy' className='text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1'>
								<FileText className='h-4 w-4' /> Privacy Policy
							</Link>
							<Link href='/terms' className='text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1'>
								<FileText className='h-4 w-4' /> Terms of Service
							</Link>
							<Link href='/cookies' className='text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1'>
								<FileText className='h-4 w-4' /> Cookie Policy
							</Link>
							<Link href='/contact' className='text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1'>
								<Mail className='h-4 w-4' /> General Contact
							</Link>
						</div>
					</div>
				</div>
			</div>
		</Layout>
	);
}
