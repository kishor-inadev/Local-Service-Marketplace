'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ROUTES } from '@/config/constants';
import { Mail, Facebook, Twitter, Linkedin, Instagram } from 'lucide-react';
import toast from 'react-hot-toast';

export function Footer() {
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
    toast.success('Thanks for subscribing! We\'ll keep you updated.');
    setEmail('');
    setTimeout(() => setSubscribed(false), 3000);
  };

  return (
    <footer className="bg-gray-900 dark:bg-gray-950 border-t border-gray-800 mt-auto">
      <div className="max-w-7xl mx-auto py-14 px-4 sm:px-6 lg:px-8">
        {/* Brand row */}
        <div className="mb-10 pb-10 border-b border-gray-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-lg font-bold text-primary-400">Local Service Marketplace</span>
            <p className="mt-1 text-sm text-gray-500">Connecting trusted professionals with local customers.</p>
          </div>
          <div className="flex gap-3">
            <Link href={ROUTES.SIGNUP} className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-b from-primary-500 to-primary-600 rounded-lg hover:from-primary-400 hover:to-primary-500 shadow-sm shadow-primary-500/25 transition-all duration-200">
              Get Started
            </Link>
            <Link href={ROUTES.HOW_IT_WORKS} className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white border border-gray-700 rounded-lg hover:border-gray-600 transition-colors">
              How it's Work
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* About */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 tracking-widest uppercase mb-4">
              About
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href={ROUTES.ABOUT}
                  className="text-sm text-gray-500 hover:text-white transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.HOW_IT_WORKS}
                  className="text-sm text-gray-500 hover:text-white transition-colors"
                >
                  How It Works
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.CAREERS}
                  className="text-sm text-gray-500 hover:text-white transition-colors"
                >
                  Careers
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.PRICING}
                  className="text-sm text-gray-500 hover:text-white transition-colors"
                >
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 tracking-widest uppercase mb-4">
              Support
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href={ROUTES.HELP}
                  className="text-sm text-gray-500 hover:text-white transition-colors"
                >
                  Help Center
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.CONTACT}
                  className="text-sm text-gray-500 hover:text-white transition-colors"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.FAQ}
                  className="text-sm text-gray-500 hover:text-white transition-colors"
                >
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 tracking-widest uppercase mb-4">
              Quick Links
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href={ROUTES.PROVIDERS}
                  className="text-sm text-gray-500 hover:text-white transition-colors"
                >
                  Find Providers
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.CREATE_REQUEST}
                  className="text-sm text-gray-500 hover:text-white transition-colors"
                >
                  Post a Request
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.SIGNUP}
                  className="text-sm text-gray-500 hover:text-white transition-colors"
                >
                  Sign Up
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.LOGIN}
                  className="text-sm text-gray-500 hover:text-white transition-colors"
                >
                  Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 tracking-widest uppercase mb-4">
              Legal
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href={ROUTES.PRIVACY}
                  className="text-sm text-gray-500 hover:text-white transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.TERMS}
                  className="text-sm text-gray-500 hover:text-white transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.COOKIES}
                  className="text-sm text-gray-500 hover:text-white transition-colors"
                >
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 tracking-widest uppercase mb-4">
              Stay Updated
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Subscribe to get updates and special offers.
            </p>
            <form onSubmit={handleSubscribe} className="space-y-2">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email"
                  className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-gray-800 text-white placeholder:text-gray-500 transition-colors"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-b from-primary-500 to-primary-600 rounded-lg hover:from-primary-400 hover:to-primary-500 shadow-sm shadow-primary-500/25 transition-all duration-200"
              >
                {subscribed ? 'Subscribed! ✓' : 'Subscribe'}
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            {/* Copyright */}
            <p className="text-sm text-gray-600 text-center md:text-left">
              © {currentYear} Local Service Marketplace. All rights reserved.
            </p>

            {/* Social Links */}
            <div className="flex items-center space-x-5">
              <a
                href={process.env.NEXT_PUBLIC_FACEBOOK_URL || '/contact'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-white transition-colors"
                aria-label="Follow us on Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href={process.env.NEXT_PUBLIC_TWITTER_URL || '/contact'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-white transition-colors"
                aria-label="Follow us on Twitter"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href={process.env.NEXT_PUBLIC_LINKEDIN_URL || '/contact'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-white transition-colors"
                aria-label="Follow us on LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <a
                href={process.env.NEXT_PUBLIC_INSTAGRAM_URL || '/contact'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-white transition-colors"
                aria-label="Follow us on Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
            </div>

            {/* Quick Links */}
            <div className="flex items-center space-x-4 text-sm">
              <Link
                href={ROUTES.PRIVACY}
                className="text-gray-600 hover:text-white transition-colors"
              >
                Privacy
              </Link>
              <span className="text-gray-700">•</span>
              <Link
                href={ROUTES.TERMS}
                className="text-gray-600 hover:text-white transition-colors"
              >
                Terms
              </Link>
              <span className="text-gray-700">•</span>
              <Link
                href={ROUTES.COOKIES}
                className="text-gray-600 hover:text-white transition-colors"
              >
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
