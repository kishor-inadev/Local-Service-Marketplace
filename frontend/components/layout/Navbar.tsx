'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from '@/hooks/useNotifications';
import { isNotificationsEnabled, isMessagingEnabled } from '@/config/features';
import { ROUTES } from '@/config/constants';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { SearchAutocomplete } from '@/components/ui/SearchAutocomplete';
import { Bell, LogOut, User, Menu, X, ChevronDown, Settings } from 'lucide-react';
import { useState } from 'react';

export function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  // Only fetch notifications when user is authenticated
  const { unreadCount } = useNotifications({ enabled: isAuthenticated });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await logout();
  };

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);

  return (
		<nav
			aria-label='Main navigation'
			className='sticky top-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-100/80 dark:border-gray-800 shadow-sm'>
			<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
				<div className='flex justify-between h-16'>
					{/* Logo */}
					<div className='flex items-center'>
						<Link
							href={isAuthenticated ? ROUTES.DASHBOARD : ROUTES.HOME}
							className='text-xl font-bold text-primary-600 dark:text-primary-400'>
							Local Service Marketplace
						</Link>
					</div>

					{/* Search Bar (Desktop Only) */}
					{isAuthenticated && (
						<div className='hidden md:flex items-center flex-1 max-w-md mx-8'>
							<SearchAutocomplete placeholder='Search providers, categories...' />
						</div>
					)}

					{/* Desktop Navigation */}
					<div className='hidden md:flex items-center space-x-4'>
						{isAuthenticated ?
							<>
								<Link
									href={ROUTES.DASHBOARD}
								className={`px-3 py-2 text-sm font-medium transition-colors duration-150 ${
									pathname === ROUTES.DASHBOARD ?
										"text-primary-600 dark:text-primary-400 border-b-2 border-primary-500"
									:	"text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
									}`}>
									Dashboard
								</Link>
								{/* Provider-only links */}
								{user?.role === "provider" && (
									<>
										<Link
											href={ROUTES.DASHBOARD_BROWSE_REQUESTS}
										className={`px-3 py-2 text-sm font-medium transition-colors duration-150 ${
											pathname === ROUTES.DASHBOARD_BROWSE_REQUESTS ?
												"text-primary-600 dark:text-primary-400 border-b-2 border-primary-500"
											:	"text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
											}`}>
											Browse Requests
										</Link>
										<Link
											href={ROUTES.DASHBOARD_MY_PROPOSALS}
										className={`px-3 py-2 text-sm font-medium transition-colors duration-150 ${
											pathname === ROUTES.DASHBOARD_MY_PROPOSALS ?
												"text-primary-600 dark:text-primary-400 border-b-2 border-primary-500"
											:	"text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
											}`}>
											My Proposals
										</Link>
										<Link
											href={ROUTES.DASHBOARD_EARNINGS}
										className={`px-3 py-2 text-sm font-medium transition-colors duration-150 ${
											pathname === ROUTES.DASHBOARD_EARNINGS ?
												"text-primary-600 dark:text-primary-400 border-b-2 border-primary-500"
											:	"text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
											}`}>
											Earnings
										</Link>
									</>
								)}
								{/* Customer-only links */}
								{user?.role === "customer" && (
									<>
										<Link
											href={ROUTES.DASHBOARD_REQUESTS}
										className={`px-3 py-2 text-sm font-medium transition-colors duration-150 ${
											pathname?.startsWith(ROUTES.DASHBOARD_REQUESTS) ?
												"text-primary-600 dark:text-primary-400 border-b-2 border-primary-500"
											:	"text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
										}`}>
										Requests
									</Link>
									<Link
										href={ROUTES.DASHBOARD_JOBS}
										className={`px-3 py-2 text-sm font-medium transition-colors duration-150 ${
											pathname?.startsWith(ROUTES.DASHBOARD_JOBS) ?
												"text-primary-600 dark:text-primary-400 border-b-2 border-primary-500"
											:	"text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
											}`}>
											Jobs
										</Link>
									</>
								)}
								{/* Admin-only link */}
								{user?.role === "admin" && (
									<Link
										href={ROUTES.DASHBOARD_ADMIN}
										className={`px-3 py-2 rounded-md text-sm font-medium ${
											pathname?.startsWith(ROUTES.DASHBOARD_ADMIN) ?
												"text-primary-600 bg-primary-50 dark:text-primary-400 dark:bg-primary-900/20"
											:	"text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
										}`}>
										Admin
									</Link>
								)}
								{isMessagingEnabled() && (
									<Link
										href={ROUTES.DASHBOARD_MESSAGES}
										className={`px-3 py-2 rounded-md text-sm font-medium ${
											pathname === ROUTES.DASHBOARD_MESSAGES ?
												"text-primary-600 bg-primary-50 dark:text-primary-400 dark:bg-primary-900/20"
											:	"text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
										}`}>
										Messages
									</Link>
								)}
								{isNotificationsEnabled() && (
									<Link
										href={ROUTES.DASHBOARD_NOTIFICATIONS}
										aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
										className='relative p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors'>
										<Bell className='h-5 w-5' />
										{unreadCount > 0 && (
											<span className='absolute -top-1 -right-1 inline-flex items-center justify-center h-5 w-5 text-xs font-bold text-white bg-red-500 rounded-full'>
												{unreadCount > 9 ? "9+" : unreadCount}
											</span>
										)}
									</Link>
								)}
								<ThemeToggle />
								{/* User Menu Dropdown */}
								<div
								className='relative border-l border-gray-100 dark:border-gray-800 pl-4'
								ref={userMenuRef}>
								<button
									onClick={() => setUserMenuOpen(!userMenuOpen)}
									aria-expanded={userMenuOpen}
									aria-haspopup='true'
									className='flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-150'>
										<User className='h-5 w-5' />
										<span className='text-sm font-medium'>{user?.name || user?.email}</span>
										<ChevronDown className='h-4 w-4' />
									</button>
									{userMenuOpen && (
										<div
								className='absolute right-0 mt-2 w-52 bg-white dark:bg-gray-900 rounded-xl shadow-lg shadow-black/10 py-1.5 z-50 border border-gray-100 dark:border-gray-800 ring-1 ring-inset ring-black/5 dark:ring-white/5'>
											<Link
												href={ROUTES.DASHBOARD_PROFILE}
												onClick={() => setUserMenuOpen(false)}
												className='flex items-center gap-2 px-3.5 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors'>
												<User className='w-4 h-4 text-gray-400' />
												View Profile
											</Link>
											<Link
												href={ROUTES.DASHBOARD_SETTINGS}
												onClick={() => setUserMenuOpen(false)}
												className='flex items-center gap-2 px-3.5 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors'>
												<Settings className='w-4 h-4 text-gray-400' />
												Settings
											</Link>
											<hr className='my-1.5 border-gray-100 dark:border-gray-800' />
											<button
												onClick={() => {
													setUserMenuOpen(false);
													handleLogout();
												}}
												className='flex w-full items-center gap-2 px-3.5 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors'>
												<LogOut className='w-4 h-4' />
												Logout
											</button>
										</div>
									)}
								</div>
							</>
						:	<>
								<Link
									href={ROUTES.ABOUT}
									className='px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400'>
									About
								</Link>
								<Link
									href={ROUTES.HOW_IT_WORKS}
									className='px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400'>
									How It Works
								</Link>
								<Link
									href={ROUTES.PROVIDERS}
									className='px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400'>
									Find Providers
								</Link>
								<Link
									href={ROUTES.HELP}
									className='px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400'>
									Help
								</Link>
								<ThemeToggle />
								<Link
									href={ROUTES.LOGIN}
									className='px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400'>
									Login
								</Link>
								<Link
									href={ROUTES.SIGNUP}
								className='px-4 py-2 text-sm font-medium text-white bg-gradient-to-b from-primary-500 to-primary-600 rounded-lg hover:from-primary-400 hover:to-primary-500 shadow-sm shadow-primary-500/25 hover:shadow-md transition-all duration-200'>
									Sign Up
								</Link>
							</>
						}
					</div>

					{/* Mobile menu button */}
					<div className='md:hidden flex items-center'>
						<button
							onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
							aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
							aria-expanded={mobileMenuOpen}
							className='p-2 text-gray-600 dark:text-gray-300'>
							{mobileMenuOpen ?
								<X className='h-6 w-6' />
							:	<Menu className='h-6 w-6' />}
						</button>
					</div>
				</div>
			</div>

			{/* Mobile menu */}
			{mobileMenuOpen && (
				<div className='md:hidden border-t dark:border-gray-700 bg-white dark:bg-gray-800'>
					<div className='px-2 pt-2 pb-3 space-y-1'>
						{isAuthenticated ?
							<>
								<Link
									href={ROUTES.DASHBOARD}
									className='block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700'>
									Dashboard
								</Link>
								{/* Provider-only mobile links */}
								{user?.role === "provider" && (
									<>
										<Link
											href={ROUTES.DASHBOARD_BROWSE_REQUESTS}
											className='block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700'>
											Browse Requests
										</Link>
										<Link
											href={ROUTES.DASHBOARD_MY_PROPOSALS}
											className='block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700'>
											My Proposals
										</Link>
										<Link
											href={ROUTES.DASHBOARD_EARNINGS}
											className='block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700'>
											Earnings
										</Link>
									</>
								)}
								{/* Customer-only mobile links */}
								{user?.role === "customer" && (
									<>
										<Link
											href={ROUTES.DASHBOARD_REQUESTS}
											className='block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700'>
											Requests
										</Link>
										<Link
											href={ROUTES.DASHBOARD_JOBS}
											className='block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700'>
											Jobs
										</Link>
										<Link
											href={ROUTES.DASHBOARD_FAVORITES}
											className='block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700'>
											Favorites
										</Link>
									</>
								)}
								{/* Admin-only mobile link */}
								{user?.role === "admin" && (
									<Link
										href={ROUTES.DASHBOARD_ADMIN}
										className='block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700'>
										Admin
									</Link>
								)}
								{isMessagingEnabled() && (
									<Link
										href={ROUTES.DASHBOARD_MESSAGES}
										className='block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700'>
										Messages
									</Link>
								)}
								{isNotificationsEnabled() && (
									<Link
										href={ROUTES.DASHBOARD_NOTIFICATIONS}
										className='block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700'>
										Notifications {unreadCount > 0 && `(${unreadCount})`}
									</Link>
								)}
								<Link
									href={ROUTES.DASHBOARD_PROFILE}
									className='block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700'>
									Profile
								</Link>
								<Link
									href={ROUTES.DASHBOARD_SETTINGS}
									className='block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700'>
									Settings
								</Link>
								<div className='px-3 py-2'>
									<ThemeToggle />
								</div>
								<button
									onClick={handleLogout}
									className='w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'>
									Logout
								</button>
							</>
						:	<>
								<Link
									href={ROUTES.ABOUT}
									className='block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700'>
									About
								</Link>
								<Link
									href={ROUTES.HOW_IT_WORKS}
									className='block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700'>
									How It Works
								</Link>
								<Link
									href={ROUTES.PROVIDERS}
									className='block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700'>
									Find Providers
								</Link>
								<Link
									href={ROUTES.HELP}
									className='block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700'>
									Help
								</Link>
								<Link
									href={ROUTES.CONTACT}
									className='block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700'>
									Contact
								</Link>
								<Link
									href={ROUTES.LOGIN}
									className='block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700'>
									Login
								</Link>
								<Link
									href={ROUTES.SIGNUP}
									className='block px-3 py-2 rounded-md text-base font-medium text-white bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600'>
									Sign Up
								</Link>
								<div className='px-3 py-2'>
									<ThemeToggle />
								</div>
							</>
						}
					</div>
				</div>
			)}
		</nav>
	);
}
