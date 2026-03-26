'use client';

import { useAuth } from "@/hooks/useAuth";
import { Layout } from '@/components/layout/Layout';
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from '@/components/ui/Button';
import { Settings, Database, Mail, Shield } from 'lucide-react';
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import toast from "react-hot-toast";

export default function AdminSettingsPage() {
  useAuth();

  const comingSoon = (label: string) => () =>
		toast(`${label} configuration is managed via environment variables.`, { icon: "ℹ️" });

  return (
		<ProtectedRoute requiredRoles={["admin"]}>
			<Layout>
				<div className='container-custom py-12'>
					<div className='mb-8'>
						<h1 className='text-3xl font-bold text-gray-900 dark:text-white mb-2'>System Settings</h1>
						<p className='text-gray-600 dark:text-gray-400'>Configure system-wide settings and preferences</p>
					</div>

					<div className='grid gap-6'>
						{/* General Settings */}
						<Card>
							<CardHeader>
								<div className='flex items-center gap-2'>
									<Settings className='h-5 w-5 text-primary-600' />
									<h2 className='text-lg font-semibold text-gray-900 dark:text-white'>General Settings</h2>
								</div>
							</CardHeader>
							<CardContent>
								<div className='space-y-4'>
									<div className='flex items-center justify-between'>
										<div>
											<p className='font-medium text-gray-900 dark:text-white'>Platform Name</p>
											<p className='text-sm text-gray-600 dark:text-gray-400'>Local Service Marketplace</p>
										</div>
										<Button
											variant='outline'
											size='sm'
											onClick={comingSoon("Platform name")}>
											Edit
										</Button>
									</div>
									<div className='flex items-center justify-between'>
										<div>
											<p className='font-medium text-gray-900 dark:text-white'>Maintenance Mode</p>
											<p className='text-sm text-gray-600 dark:text-gray-400'>Currently disabled</p>
										</div>
										<Button
											variant='outline'
											size='sm'
											onClick={comingSoon("Maintenance mode")}>
											Configure
										</Button>
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Email Settings */}
						<Card>
							<CardHeader>
								<div className='flex items-center gap-2'>
									<Mail className='h-5 w-5 text-primary-600' />
									<h2 className='text-lg font-semibold text-gray-900 dark:text-white'>Email Settings</h2>
								</div>
							</CardHeader>
							<CardContent>
								<div className='space-y-4'>
									<div className='flex items-center justify-between'>
										<div>
											<p className='font-medium text-gray-900 dark:text-white'>SMTP Configuration</p>
											<p className='text-sm text-gray-600 dark:text-gray-400'>Configure email delivery settings</p>
										</div>
										<Button
											variant='outline'
											size='sm'
											onClick={comingSoon("SMTP")}>
											Configure
										</Button>
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Security Settings */}
						<Card>
							<CardHeader>
								<div className='flex items-center gap-2'>
									<Shield className='h-5 w-5 text-primary-600' />
									<h2 className='text-lg font-semibold text-gray-900 dark:text-white'>Security Settings</h2>
								</div>
							</CardHeader>
							<CardContent>
								<div className='space-y-4'>
									<div className='flex items-center justify-between'>
										<div>
											<p className='font-medium text-gray-900 dark:text-white'>Password Policy</p>
											<p className='text-sm text-gray-600 dark:text-gray-400'>Minimum 8 characters required</p>
										</div>
										<Button
											variant='outline'
											size='sm'
											onClick={comingSoon("Password policy")}>
											Configure
										</Button>
									</div>
									<div className='flex items-center justify-between'>
										<div>
											<p className='font-medium text-gray-900 dark:text-white'>Two-Factor Authentication</p>
											<p className='text-sm text-gray-600 dark:text-gray-400'>Optional for users</p>
										</div>
										<Button
											variant='outline'
											size='sm'
											onClick={comingSoon("Two-factor authentication")}>
											Configure
										</Button>
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Database */}
						<Card>
							<CardHeader>
								<div className='flex items-center gap-2'>
									<Database className='h-5 w-5 text-primary-600' />
									<h2 className='text-lg font-semibold text-gray-900 dark:text-white'>Database</h2>
								</div>
							</CardHeader>
							<CardContent>
								<div className='space-y-4'>
									<div className='flex items-center justify-between'>
										<div>
											<p className='font-medium text-gray-900 dark:text-white'>Database Backup</p>
											<p className='text-sm text-gray-600 dark:text-gray-400'>Last backup: Not configured</p>
										</div>
										<Button
											variant='outline'
											size='sm'
											onClick={comingSoon("Database backup")}>
											Backup Now
										</Button>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</Layout>
		</ProtectedRoute>
	);
}
