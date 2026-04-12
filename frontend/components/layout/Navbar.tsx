'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { Permission } from "@/utils/permissions";
import { useNotifications } from '@/hooks/useNotifications';
import { isNotificationsEnabled, isMessagingEnabled } from '@/config/features';
import { ROUTES } from '@/config/constants';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { SearchAutocomplete } from '@/components/ui/SearchAutocomplete';
import { Bell, LogOut, User, Menu, X, ChevronDown, Settings, LayoutDashboard, Briefcase, FileText } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/utils/helpers';

export function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const { can } = usePermissions();
  const { unreadCount } = useNotifications({ enabled: isAuthenticated });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await logout();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userMenuOpen]);

  // Close mobile menu on route change
  useEffect(() => { setMobileMenuOpen(false); }, [pathname]);

  const navLinkClass = (active: boolean) => cn(
    'relative px-3 py-2 text-sm font-medium transition-colors duration-150',
    active
      ? 'text-primary-600 dark:text-primary-400'
      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
  );

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? 'U';

  return (
    <nav
      aria-label='Main navigation'
      className='sticky top-0 z-50 bg-white/95 dark:bg-gray-950/95 backdrop-blur-md border-b border-gray-200/60 dark:border-gray-800/80 shadow-sm'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between h-16 items-center'>

          {/* Logo */}
          <div className='flex items-center gap-2 flex-shrink-0'>
            <Link
              href={isAuthenticated ? ROUTES.DASHBOARD : ROUTES.HOME}
              className='flex items-center gap-2.5 group'>
              {/* Monogram mark */}
              <div className='h-8 w-8 rounded-xl bg-gradient-to-br from-primary-600 to-violet-600 flex items-center justify-center shadow-sm shadow-primary-600/30 group-hover:shadow-primary transition-shadow'>
                <span className='text-white font-bold text-sm select-none'>LS</span>
              </div>
              <span className='text-base font-bold text-gray-900 dark:text-gray-100 hidden sm:block'>
                <span className='text-primary-600 dark:text-primary-400'>Local</span>Service
              </span>
            </Link>
          </div>

          {/* Search (authenticated desktop) */}
          {isAuthenticated && (
            <div className='hidden md:flex items-center flex-1 max-w-sm mx-8'>
              <SearchAutocomplete placeholder='Search providers, services...' />
            </div>
          )}

          {/* Desktop nav */}
          <div className='hidden md:flex items-center gap-1'>
            {isAuthenticated ? (
              <>
                <Link href={ROUTES.DASHBOARD} className={navLinkClass(pathname === ROUTES.DASHBOARD)}>
                  Dashboard
                  {pathname === ROUTES.DASHBOARD && (
                    <span className='absolute bottom-0 left-3 right-3 h-0.5 bg-gradient-to-r from-primary-500 to-violet-500 rounded-full' />
                  )}
                </Link>

                {can(Permission.REQUESTS_BROWSE) && (
                  <Link href={ROUTES.DASHBOARD_BROWSE_REQUESTS} className={navLinkClass(pathname === ROUTES.DASHBOARD_BROWSE_REQUESTS)}>
                    Browse
                  </Link>
                )}
                {can(Permission.PROPOSALS_CREATE) && (
                  <Link href={ROUTES.DASHBOARD_MY_PROPOSALS} className={navLinkClass(pathname === ROUTES.DASHBOARD_MY_PROPOSALS)}>
                    Proposals
                  </Link>
                )}
                {can(Permission.EARNINGS_VIEW) && (
                  <Link href={ROUTES.DASHBOARD_EARNINGS} className={navLinkClass(pathname === ROUTES.DASHBOARD_EARNINGS)}>
                    Earnings
                  </Link>
                )}

                {can(Permission.REQUESTS_CREATE) && (
                  <Link href={ROUTES.DASHBOARD_REQUESTS} className={navLinkClass(!!pathname?.startsWith(ROUTES.DASHBOARD_REQUESTS))}>
                    Requests
                  </Link>
                )}
                {can(Permission.JOBS_READ) && (
                  <Link href={ROUTES.DASHBOARD_JOBS} className={navLinkClass(!!pathname?.startsWith(ROUTES.DASHBOARD_JOBS))}>
                    Jobs
                  </Link>
                )}

                {can(Permission.ADMIN_ACCESS) && (
                  <Link href={ROUTES.DASHBOARD_ADMIN} className={navLinkClass(!!pathname?.startsWith(ROUTES.DASHBOARD_ADMIN))}>
                    Admin
                  </Link>
                )}

                <div className='flex items-center gap-1 ml-2 pl-2 border-l border-gray-100 dark:border-gray-800'>
                  {isNotificationsEnabled() && (
                    <Link
                      href={ROUTES.DASHBOARD_NOTIFICATIONS}
                      aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
                      className='relative p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors'>
                      <Bell className='h-5 w-5' />
                      {unreadCount > 0 && (
                        <span className='absolute -top-0.5 -right-0.5 inline-flex items-center justify-center h-4 w-4 text-[10px] font-bold text-white bg-red-500 rounded-full'>
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </Link>
                  )}

                  <ThemeToggle />

                  {/* User menu */}
                  <div className='relative' ref={userMenuRef}>
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      aria-expanded={userMenuOpen}
                      aria-haspopup='true'
                      className='flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl border border-transparent hover:border-gray-200 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-150'>
                      {/* Avatar */}
                      <div className='h-7 w-7 rounded-lg bg-gradient-to-br from-primary-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0'>
                        {initials}
                      </div>
                      <span className='text-sm font-medium text-gray-700 dark:text-gray-200 hidden lg:block max-w-[100px] truncate'>
                        {user?.name?.split(' ')[0] || user?.email?.split('@')[0]}
                      </span>
                      <ChevronDown className={cn('h-3.5 w-3.5 text-gray-400 transition-transform duration-200', userMenuOpen && 'rotate-180')} />
                    </button>

                    {userMenuOpen && (
                      <div className='absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 rounded-2xl shadow-elevated border border-gray-100 dark:border-gray-800 py-2 z-50 animate-scale-in'>
                        {/* User info */}
                        <div className='px-4 py-2.5 border-b border-gray-100 dark:border-gray-800 mb-1'>
                          <p className='text-sm font-semibold text-gray-900 dark:text-gray-100 truncate'>{user?.name || 'Account'}</p>
                          <p className='text-xs text-gray-500 dark:text-gray-400 truncate'>{user?.email}</p>
                          <span className='inline-flex mt-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'>
                            {user?.role}
                          </span>
                        </div>

                        <Link href={ROUTES.DASHBOARD} onClick={() => setUserMenuOpen(false)}
                          className='flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors'>
                          <LayoutDashboard className='w-4 h-4 text-gray-400' />Dashboard
                        </Link>
                        <Link href={ROUTES.DASHBOARD_PROFILE} onClick={() => setUserMenuOpen(false)}
                          className='flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors'>
                          <User className='w-4 h-4 text-gray-400' />Profile
                        </Link>
                        <Link href={ROUTES.DASHBOARD_SETTINGS} onClick={() => setUserMenuOpen(false)}
                          className='flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors'>
                          <Settings className='w-4 h-4 text-gray-400' />Settings
                        </Link>
                        <div className='border-t border-gray-100 dark:border-gray-800 mt-1 pt-1'>
                          <button onClick={handleLogout}
                            className='flex w-full items-center gap-2.5 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors'>
                            <LogOut className='w-4 h-4' />Sign out
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link href={ROUTES.ABOUT} className={navLinkClass(false)}>About</Link>
                <Link href={ROUTES.HOW_IT_WORKS} className={navLinkClass(false)}>How It Works</Link>
                <Link href={ROUTES.PROVIDERS} className={navLinkClass(false)}>Find Providers</Link>
                <ThemeToggle />
                <Link href={ROUTES.LOGIN}
                  className='px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400 transition-colors'>
                  Log in
                </Link>
                <Link href={ROUTES.SIGNUP}
                  className='px-4 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-500 rounded-xl shadow-sm shadow-primary-600/25 hover:shadow-primary hover:-translate-y-px transition-all duration-200'>
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className='md:hidden flex items-center gap-2'>
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
              className='p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors'>
              {mobileMenuOpen ? <X className='h-5 w-5' /> : <Menu className='h-5 w-5' />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className='md:hidden border-t border-gray-100 dark:border-gray-800 bg-white/98 dark:bg-gray-950/98 backdrop-blur-md'>
          <div className='px-4 pt-3 pb-5 space-y-1'>
            {isAuthenticated ? (
              <>
                <MobileLink href={ROUTES.DASHBOARD} icon={LayoutDashboard} label='Dashboard' />
                {can(Permission.REQUESTS_BROWSE) && (
                  <MobileLink href={ROUTES.DASHBOARD_BROWSE_REQUESTS} icon={FileText} label='Browse Requests' />
                )}
                {can(Permission.PROPOSALS_CREATE) && (
                  <MobileLink href={ROUTES.DASHBOARD_MY_PROPOSALS} icon={Briefcase} label='My Proposals' />
                )}
                {can(Permission.EARNINGS_VIEW) && (
                  <MobileLink href={ROUTES.DASHBOARD_EARNINGS} icon={FileText} label='Earnings' />
                )}
                {can(Permission.REQUESTS_CREATE) && (
                  <MobileLink href={ROUTES.DASHBOARD_REQUESTS} icon={FileText} label='My Requests' />
                )}
                {can(Permission.JOBS_READ) && (
                  <MobileLink href={ROUTES.DASHBOARD_JOBS} icon={Briefcase} label='My Jobs' />
                )}
                {can(Permission.ADMIN_ACCESS) && (
                  <MobileLink href={ROUTES.DASHBOARD_ADMIN} icon={LayoutDashboard} label='Admin Panel' />
                )}
                {isMessagingEnabled() && (
                  <MobileLink href={ROUTES.DASHBOARD_MESSAGES} icon={FileText} label='Messages' />
                )}
                {isNotificationsEnabled() && (
                  <MobileLink href={ROUTES.DASHBOARD_NOTIFICATIONS} icon={Bell} label={`Notifications${unreadCount > 0 ? ` (${unreadCount})` : ''}`} />
                )}
                <div className='border-t border-gray-100 dark:border-gray-800 my-2' />
                <MobileLink href={ROUTES.DASHBOARD_PROFILE} icon={User} label='Profile' />
                <MobileLink href={ROUTES.DASHBOARD_SETTINGS} icon={Settings} label='Settings' />
                <button onClick={handleLogout}
                  className='w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors'>
                  <LogOut className='h-4 w-4' />Sign out
                </button>
              </>
            ) : (
              <>
                <MobileLink href={ROUTES.ABOUT} icon={FileText} label='About' />
                <MobileLink href={ROUTES.HOW_IT_WORKS} icon={FileText} label='How It Works' />
                <MobileLink href={ROUTES.PROVIDERS} icon={FileText} label='Find Providers' />
                <MobileLink href={ROUTES.HELP} icon={FileText} label='Help' />
                <div className='border-t border-gray-100 dark:border-gray-800 my-2' />
                <Link href={ROUTES.LOGIN}
                  className='block px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors'>
                  Log in
                </Link>
                <Link href={ROUTES.SIGNUP}
                  className='block px-3 py-2.5 rounded-xl text-sm font-semibold text-white bg-primary-600 hover:bg-primary-500 text-center transition-colors'>
                  Get Started Free
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

function MobileLink({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname?.startsWith(href + '/');
  return (
    <Link href={href}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
        isActive
          ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
      )}>
      <Icon className='h-4 w-4 flex-shrink-0' />
      {label}
    </Link>
  );
}
