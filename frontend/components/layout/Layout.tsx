'use client';

import React, { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { useAuth } from '@/hooks';

interface LayoutProps {
	children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
	const { isAuthenticated } = useAuth();
	return (
		<div className='min-h-screen flex justify-between flex-col bg-gray-50 dark:bg-gray-900'>
			<Navbar />
			<main className='flex-1'>{children}</main>
			{!isAuthenticated && <Footer />}
		</div>
	);
}
