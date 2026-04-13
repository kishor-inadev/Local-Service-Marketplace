import React from 'react';
import Link from 'next/link';
import { ROUTES } from '@/config/constants';
import { Twitter, Linkedin, Instagram, Facebook, ShieldCheck, CreditCard, Star } from 'lucide-react';
import { NewsletterForm } from './NewsletterForm';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-950 border-t border-gray-800/60 mt-auto">
      {/* Trust bar */}
      <div className="border-b border-gray-800/60 py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-x-10 gap-y-3 text-sm text-gray-500">
            <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-accent-500" />Verified Providers</span>
            <span className="flex items-center gap-2"><CreditCard className="h-4 w-4 text-primary-400" />Secured Escrow Payments</span>
            <span className="flex items-center gap-2"><Star className="h-4 w-4 text-amber-400" />4.9/5 Average Rating</span>
            <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-accent-500" />Money-Back Guarantee</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-14 px-4 sm:px-6 lg:px-8">
        {/* Brand + CTA row */}
        <div className="mb-12 pb-10 border-b border-gray-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary-600 to-violet-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">LS</span>
              </div>
              <span className="text-base font-bold text-white">
                <span className="text-primary-400">Local</span>Service
              </span>
            </div>
            <p className="text-sm text-gray-500 max-w-xs">Connecting trusted professionals with local customers since 2020.</p>
          </div>
          <div className="flex gap-3">
            <Link href={ROUTES.SIGNUP}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-500 rounded-xl shadow-sm shadow-primary-600/30 transition-all duration-200">
              Get Started Free
            </Link>
            <Link href={ROUTES.HOW_IT_WORKS}
              className="px-5 py-2.5 text-sm font-semibold text-gray-300 hover:text-white border border-gray-700 hover:border-gray-500 rounded-xl transition-colors">
              How It Works
            </Link>
          </div>
        </div>

        {/* Links grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10">
          {/* Product */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 tracking-widest uppercase mb-4">Product</h3>
            <ul className="space-y-3">
              {[
                { label: 'Find Providers', href: ROUTES.PROVIDERS },
                { label: 'Post a Request', href: ROUTES.CREATE_REQUEST },
                { label: 'Pricing', href: ROUTES.PRICING },
                { label: 'How It Works', href: ROUTES.HOW_IT_WORKS },
              ].map(l => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-gray-500 hover:text-white transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 tracking-widest uppercase mb-4">Company</h3>
            <ul className="space-y-3">
              {[
                { label: 'About Us', href: ROUTES.ABOUT },
                { label: 'Careers', href: ROUTES.CAREERS },
                { label: 'Blog', href: '/blog' },
                { label: 'Contact', href: ROUTES.CONTACT },
              ].map(l => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-gray-500 hover:text-white transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 tracking-widest uppercase mb-4">Support</h3>
            <ul className="space-y-3">
              {[
                { label: 'Help Center', href: ROUTES.HELP },
                { label: 'FAQ', href: ROUTES.FAQ },
                { label: 'Safety', href: '/safety' },
                { label: 'Community', href: '/community' },
              ].map(l => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-gray-500 hover:text-white transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 tracking-widest uppercase mb-4">Legal</h3>
            <ul className="space-y-3">
              {[
                { label: 'Privacy Policy', href: ROUTES.PRIVACY },
                { label: 'Terms of Service', href: ROUTES.TERMS },
                { label: 'Cookie Policy', href: ROUTES.COOKIES },
                { label: 'Grievance Officer', href: ROUTES.GRIEVANCE_OFFICER },
              ].map(l => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-gray-500 hover:text-white transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <h3 className="text-xs font-semibold text-gray-400 tracking-widest uppercase mb-4">Stay Updated</h3>
            <p className="text-sm text-gray-500 mb-4">Get tips, deals, and platform news.</p>
            <NewsletterForm />
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-14 pt-8 border-t border-gray-800/60 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-600">© {currentYear} Local Service Marketplace. All rights reserved.</p>

          {/* Social icons */}
          <div className="flex items-center gap-4">
            {[
              { href: process.env.NEXT_PUBLIC_TWITTER_URL || '/contact', Icon: Twitter, label: 'Twitter' },
              { href: process.env.NEXT_PUBLIC_LINKEDIN_URL || '/contact', Icon: Linkedin, label: 'LinkedIn' },
              { href: process.env.NEXT_PUBLIC_FACEBOOK_URL || '/contact', Icon: Facebook, label: 'Facebook' },
              { href: process.env.NEXT_PUBLIC_INSTAGRAM_URL || '/contact', Icon: Instagram, label: 'Instagram' },
            ].map(({ href, Icon, label }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={`Follow us on ${label}`}
                className="text-gray-600 hover:text-primary-400 transition-colors">
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>

          <div className="flex items-center gap-4 text-sm">
            <Link href={ROUTES.PRIVACY} className="text-gray-600 hover:text-white transition-colors">Privacy</Link>
            <span className="text-gray-800">·</span>
            <Link href={ROUTES.TERMS} className="text-gray-600 hover:text-white transition-colors">Terms</Link>
            <span className="text-gray-800">·</span>
            <Link href={ROUTES.COOKIES} className="text-gray-600 hover:text-white transition-colors">Cookies</Link>
            <span className="text-gray-800">·</span>
            <Link href={ROUTES.GRIEVANCE_OFFICER} className="text-gray-600 hover:text-white transition-colors">Grievance</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}