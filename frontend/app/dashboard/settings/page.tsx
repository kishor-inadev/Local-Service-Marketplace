'use client';

import Link from 'next/link';
import { Bell, CreditCard, Crown, Lock, Settings as SettingsIcon, ChevronRight } from 'lucide-react';
import { SettingsLayout } from '@/components/layout/SettingsLayout';
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { ROUTES } from '@/config/constants';

const settingsCards = [
	{
		href: ROUTES.DASHBOARD_SETTINGS_NOTIFICATIONS,
		icon: Bell,
		title: 'Notifications',
		description: 'Control which alerts and emails you receive for activity on your account.',
		color: 'text-blue-500',
		bg: 'bg-blue-50 dark:bg-blue-900/20',
	},
	{
		href: ROUTES.DASHBOARD_SETTINGS_PASSWORD,
		icon: Lock,
		title: 'Password & Security',
		description: 'Update your password and enable two-factor authentication.',
		color: 'text-green-500',
		bg: 'bg-green-50 dark:bg-green-900/20',
	},
	{
		href: ROUTES.DASHBOARD_SETTINGS_PAYMENT_METHODS,
		icon: CreditCard,
		title: 'Payment Methods',
		description: 'Add or remove saved cards and UPI accounts for faster checkout.',
		color: 'text-purple-500',
		bg: 'bg-purple-50 dark:bg-purple-900/20',
	},
	{
		href: ROUTES.DASHBOARD_SETTINGS_SUBSCRIPTION,
		icon: Crown,
		title: 'Subscription',
		description: 'View your active plan, upgrade, or manage billing details.',
		color: 'text-amber-500',
		bg: 'bg-amber-50 dark:bg-amber-900/20',
	},
];

function SettingsContent() {
	return (
		<SettingsLayout>
			<div>
				<h2 className='text-xl font-semibold text-gray-900 dark:text-white mb-1'>General Settings</h2>
				<p className='text-sm text-gray-500 dark:text-gray-400 mb-6'>
					Manage your account preferences and security options.
				</p>

				<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
					{settingsCards.map(({ href, icon: Icon, title, description, color, bg }) => (
						<Link
							key={href}
							href={href}
							className='group flex items-start gap-4 p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all'
						>
							<div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${bg}`}>
								<Icon className={`w-5 h-5 ${color}`} />
							</div>
							<div className='flex-1 min-w-0'>
								<div className='flex items-center justify-between'>
									<h3 className='font-medium text-gray-900 dark:text-white text-sm'>{title}</h3>
									<ChevronRight className='w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors flex-shrink-0 ml-2' />
								</div>
								<p className='mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-2'>{description}</p>
							</div>
						</Link>
					))}
				</div>

				<div className='mt-6 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700'>
					<div className='flex items-center gap-2 mb-1'>
						<SettingsIcon className='w-4 h-4 text-gray-400' />
						<span className='text-sm font-medium text-gray-700 dark:text-gray-300'>Quick tip</span>
					</div>
					<p className='text-xs text-gray-500 dark:text-gray-400'>
						Keep your password strong and enable notifications so you never miss an update on your service requests.
					</p>
				</div>
			</div>
		</SettingsLayout>
	);
}

export default function SettingsPage() {
	return (
		<ProtectedRoute>
			<SettingsContent />
		</ProtectedRoute>
	);
}

