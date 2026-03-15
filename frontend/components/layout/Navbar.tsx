'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useNotifications } from '@/hooks/useNotifications';
import { isNotificationsEnabled, isMessagingEnabled } from '@/config/features';
import { ROUTES } from '@/config/constants';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { SearchAutocomplete } from '@/components/ui/SearchAutocomplete';
import { Bell, LogOut, User, Menu, X, ChevronDown, Settings } from 'lucide-react';
import { useState } from 'react';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  // Only fetch notifications when user is authenticated
  const { unreadCount } = useNotifications({ enabled: isAuthenticated });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await logout();
    router.push(ROUTES.LOGIN);
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
    <nav className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link
              href={isAuthenticated ? ROUTES.DASHBOARD : ROUTES.HOME}
              className="text-xl font-bold text-primary-600 dark:text-primary-400"
            >
              Local Service Marketplace
            </Link>
          </div>

          {/* Search Bar (Desktop Only) */}
          {isAuthenticated && (
            <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
              <SearchAutocomplete placeholder="Search providers, categories..." />
            </div>
          )}

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">{isAuthenticated ? (
              <>
                <Link
                  href={ROUTES.DASHBOARD}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    pathname === ROUTES.DASHBOARD
                      ? 'text-primary-600 bg-primary-50 dark:text-primary-400 dark:bg-primary-900/20'
                      : 'text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href={ROUTES.PROVIDERS}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    pathname?.startsWith(ROUTES.PROVIDERS)
                      ? 'text-primary-600 bg-primary-50 dark:text-primary-400 dark:bg-primary-900/20'
                      : 'text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400'
                  }`}
                >
                  Providers
                </Link>
                <Link
                  href={ROUTES.REQUESTS}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    pathname?.startsWith(ROUTES.REQUESTS)
                      ? 'text-primary-600 bg-primary-50 dark:text-primary-400 dark:bg-primary-900/20'
                      : 'text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400'
                  }`}
                >
                  Requests
                </Link>
                <Link
                  href={ROUTES.JOBS}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    pathname?.startsWith(ROUTES.JOBS)
                      ? 'text-primary-600 bg-primary-50 dark:text-primary-400 dark:bg-primary-900/20'
                      : 'text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400'
                  }`}
                >
                  Jobs
                </Link>
                {isMessagingEnabled() && (
                  <Link
                    href={ROUTES.MESSAGES}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      pathname === ROUTES.MESSAGES
                        ? 'text-primary-600 bg-primary-50 dark:text-primary-400 dark:bg-primary-900/20'
                        : 'text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400'
                    }`}
                  >
                    Messages
                  </Link>
                )}

                {/* Notifications with Badge */}
                {isNotificationsEnabled() && (
                  <Link
                    href={ROUTES.NOTIFICATIONS}
                    className="relative p-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 inline-flex items-center justify-center h-5 w-5 text-xs font-bold text-white bg-red-500 rounded-full">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Link>
                )}

                {/* Theme Toggle */}
                <ThemeToggle />

                {/* User Menu Dropdown */}
                <div className="relative border-l dark:border-gray-600 pl-4" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
                  >
                    <User className="h-5 w-5" />
                    <span className="text-sm font-medium">
                      {user?.name || user?.email}
                    </span>
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 border border-gray-200 dark:border-gray-700">
                      <Link
                        href={ROUTES.PROFILE}
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <User className="inline-block w-4 h-4 mr-2" />
                        View Profile
                      </Link>
                      <Link
                        href={ROUTES.SETTINGS}
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <Settings className="inline-block w-4 h-4 mr-2" />
                        Settings
                      </Link>
                      <hr className="my-1 border-gray-200 dark:border-gray-700" />
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          handleLogout();
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <LogOut className="inline-block w-4 h-4 mr-2" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  href={ROUTES.ABOUT}
                  className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
                >
                  About
                </Link>
                <Link
                  href={ROUTES.HOW_IT_WORKS}
                  className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
                >
                  How It Works
                </Link>
                <Link
                  href={ROUTES.HELP}
                  className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
                >
                  Help
                </Link>
                <ThemeToggle />
                <Link
                  href={ROUTES.LOGIN}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
                >
                  Login
                </Link>
                <Link
                  href={ROUTES.SIGNUP}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-600 dark:text-gray-300"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {isAuthenticated ? (
              <>
                <Link
                  href={ROUTES.DASHBOARD}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Dashboard
                </Link>
                <Link
                  href={ROUTES.PROVIDERS}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Providers
                </Link>
                <Link
                  href={ROUTES.REQUESTS}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Requests
                </Link>
                <Link
                  href={ROUTES.JOBS}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Jobs
                </Link>
                {isMessagingEnabled() && (
                  <Link
                    href={ROUTES.MESSAGES}
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Messages
                  </Link>
                )}
                {isNotificationsEnabled() && (
                  <Link
                    href={ROUTES.NOTIFICATIONS}
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Notifications {unreadCount > 0 && `(${unreadCount})`}
                  </Link>
                )}
                <Link
                  href={ROUTES.PROFILE}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Profile
                </Link>
                <Link
                  href={ROUTES.SETTINGS}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Settings
                </Link>
                <div className="px-3 py-2">
                  <ThemeToggle />
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href={ROUTES.ABOUT}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  About
                </Link>
                <Link
                  href={ROUTES.HOW_IT_WORKS}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  How It Works
                </Link>
                <Link
                  href={ROUTES.HELP}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Help
                </Link>
                <Link
                  href={ROUTES.CONTACT}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Contact
                </Link>
                <Link
                  href={ROUTES.LOGIN}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Login
                </Link>
                <Link
                  href={ROUTES.SIGNUP}
                  className="block px-3 py-2 rounded-md text-base font-medium text-white bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600"
                >
                  Sign Up
                </Link>
                <div className="px-3 py-2">
                  <ThemeToggle />
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
