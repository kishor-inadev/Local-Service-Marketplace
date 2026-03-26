'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
import Link from 'next/link';
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from '@/config/constants';
import { getUserProfile, getProviderProfile } from '@/services/user-service';
import { getProviderReviews } from '@/services/review-service';
import { Loading } from '@/components/ui/Loading';
import { ErrorState } from '@/components/ui/ErrorState';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Edit, 
  Star,
  Briefcase,
  Calendar,
  Award,
  MessageCircle,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/utils/helpers';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const { data: profile, isLoading: profileLoading, error: profileError, refetch } = useQuery({
    queryKey: ['my-profile'],
    queryFn: getUserProfile,
    enabled: isAuthenticated,
  });

  const isProvider = profile?.role === 'provider' || user?.role === 'provider';

  const { data: providerProfile, isLoading: providerLoading } = useQuery({
    queryKey: ['my-provider-profile', user?.id],
    queryFn: () => getProviderProfile(user!.id),
    enabled: isAuthenticated && isProvider && !!user?.id,
  });

  const { data: reviews } = useQuery({
    queryKey: ['my-provider-reviews', user?.id],
    queryFn: () => getProviderReviews(user!.id),
    enabled: isAuthenticated && isProvider && !!user?.id,
  });

  if (authLoading || profileLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loading />
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Please log in to view your profile
            </h2>
            <Link
              href={ROUTES.LOGIN}
              className="inline-block bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-semibold transition"
            >
              Log In
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  if (profileError) {
    return (
      <Layout>
        <div className="container-custom py-12">
          <ErrorState
            title="Failed to load profile"
            message="We couldn't load your profile data. Please try again."
            retry={() => refetch()}
          />
        </div>
      </Layout>
    );
  }

  const displayName = profile?.name || user?.name || 'Your Profile';
  const displayEmail = profile?.email || user?.email || '';

  return (
    <Layout>
      <div className="bg-white dark:bg-gray-900 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
            {/* Cover Image */}
            <div className="h-32 bg-gradient-to-r from-primary-600 to-primary-800"></div>

            {/* Profile Info */}
            <div className="px-6 pb-6">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between -mt-16">
                <div className="flex flex-col sm:flex-row sm:items-end">
                  {/* Avatar */}
                  <div className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-800 bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-4xl font-bold text-gray-600 dark:text-gray-300 overflow-hidden">
                    {profile?.profile_picture_url ? (
                      <img src={profile.profile_picture_url} alt={displayName} className="w-full h-full object-cover" />
                    ) : (
                      displayName.charAt(0).toUpperCase()
                    )}
                  </div>

                  {/* Name and Role */}
                  <div className="mt-4 sm:mt-0 sm:ml-6">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                      {displayName}
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400 capitalize">
                      {profile?.role || user?.role}
                    </p>
                    {isProvider && providerProfile?.rating ? (
                      <div className="flex items-center mt-2">
                        <Star className="w-5 h-5 text-yellow-400 fill-current" />
                        <span className="ml-1 text-lg font-semibold text-gray-900 dark:text-white">
                          {providerProfile.rating.toFixed(1)}
                        </span>
                        <span className="ml-2 text-gray-600 dark:text-gray-400">
                          ({reviews?.length ?? 0} reviews)
                        </span>
                      </div>
                    ) : null}
                    {profile?.email_verified && (
                      <div className="flex items-center mt-1 text-sm text-green-600 dark:text-green-400">
                        <Shield className="w-4 h-4 mr-1" />
                        Verified Account
                      </div>
                    )}
                  </div>
                </div>

                {/* Edit Button */}
                <Link
                  href={ROUTES.DASHBOARD_PROFILE_EDIT}
                  className="mt-4 sm:mt-0"
                >
                  <Button>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="mt-8 grid md:grid-cols-3 gap-8">
            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contact Info */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Contact Information
                </h2>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <Mail className="w-5 h-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-500">Email</p>
                      <p className="text-gray-900 dark:text-white break-all">{displayEmail}</p>
                    </div>
                  </div>
                  {profile?.phone && (
                    <div className="flex items-start">
                      <Phone className="w-5 h-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-500">Phone</p>
                        <p className="text-gray-900 dark:text-white">{profile.phone}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start">
                    <Calendar className="w-5 h-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-500">Member Since</p>
                      <p className="text-gray-900 dark:text-white">
                        {profile?.created_at ? formatDate(profile.created_at) : '—'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Provider Stats */}
              {isProvider && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Statistics
                  </h2>
                  {providerLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="flex justify-between">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse" />
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12 animate-pulse" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Jobs Completed</span>
                        <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                          {providerProfile?.total_jobs_completed ?? 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Total Reviews</span>
                        <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                          {reviews?.length ?? 0}
                        </span>
                      </div>
                      {providerProfile?.rating ? (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Average Rating</span>
                          <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                            {providerProfile.rating.toFixed(1)}
                          </span>
                        </div>
                      ) : null}
                      {providerProfile?.years_of_experience ? (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Years Experience</span>
                          <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                            {providerProfile.years_of_experience}
                          </span>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              )}

              {/* Quick Actions */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Quick Actions
                </h2>
                <div className="space-y-2">
                  <Link
                    href={ROUTES.DASHBOARD_SETTINGS}
                    className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition"
                  >
                    Settings
                  </Link>
                  <Link
                    href={ROUTES.DASHBOARD_SETTINGS_PASSWORD}
                    className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition"
                  >
                    Change Password
                  </Link>
                  <Link
                    href={ROUTES.DASHBOARD}
                    className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition"
                  >
                    My Dashboard
                  </Link>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="md:col-span-2 space-y-6">
              {/* About / Bio */}
              {isProvider && providerProfile?.description && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    About
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    {providerProfile.description}
                  </p>
                  {providerProfile.business_name && (
                    <p className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Business: {providerProfile.business_name}
                    </p>
                  )}
                </div>
              )}

              {/* Provider Verification */}
              {isProvider && providerProfile && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <Award className="w-5 h-5 mr-2" />
                    Verification Status
                  </h2>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                    ${providerProfile.verification_status === 'verified'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : providerProfile.verification_status === 'rejected'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}>
                    <Shield className="w-4 h-4 mr-1" />
                    {providerProfile.verification_status
                      ? providerProfile.verification_status.charAt(0).toUpperCase() + providerProfile.verification_status.slice(1)
                      : 'Pending'}
                  </div>
                </div>
              )}

              {/* Services (for providers) */}
              {isProvider && providerProfile?.services && providerProfile.services.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <Briefcase className="w-5 h-5 mr-2" />
                    Services Offered
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {providerProfile.services.map((svc) => (
                      <span
                        key={svc.id}
                        className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-full text-sm"
                      >
                        {svc.category_id}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Reviews */}
              {isProvider && reviews && reviews.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Recent Reviews
                  </h2>
                  <div className="space-y-4">
                    {reviews.slice(0, 3).map((review: any) => (
                      <div key={review.id} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0">
                        <div className="flex items-center mb-2">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300 dark:text-gray-600'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                            {formatDate(review.created_at)}
                          </span>
                        </div>
                        {review.comment && (
                          <p className="text-gray-700 dark:text-gray-300 text-sm">
                            {review.comment}
                          </p>
                        )}
                      </div>
                    ))}
                    {reviews.length > 3 && (
                      <Link
                        href={`${ROUTES.DASHBOARD}/provider/reviews`}
                        className="inline-block text-primary-600 dark:text-primary-400 hover:underline text-sm font-medium"
                      >
                        View all {reviews.length} reviews →
                      </Link>
                    )}
                  </div>
                </div>
              )}

              {/* Customer — no extra sections needed beyond contact */}
              {!isProvider && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                    <User className="w-5 h-5 mr-2" />
                    Account Details
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Account status: <span className="font-medium capitalize">{profile?.status ?? 'active'}</span>
                  </p>
                  {profile?.timezone && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                      Timezone: <span className="font-medium">{profile.timezone}</span>
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}


  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Please log in to view your profile
            </h2>
            <Link
              href={ROUTES.LOGIN}
              className="inline-block bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-semibold transition"
            >
              Log In
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  // Mock data - in real app, this would come from API
  const profileData = {
    name: user?.name || 'User Name',
    email: user?.email || 'user@example.com',
    phone: '+1 (234) 567-8900',
    location: 'San Francisco, CA',
    joined: 'January 2024',
    role: user?.role || 'customer',
    rating: 4.8,
    reviewsCount: 127,
    jobsCompleted: 45,
    bio: 'Experienced professional dedicated to providing high-quality services.',
  };

  const isProvider = profileData.role === 'provider';

  return (
    <Layout>
      <div className="bg-white dark:bg-gray-900 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
            {/* Cover Image */}
            <div className="h-32 bg-gradient-to-r from-primary-600 to-primary-800"></div>

            {/* Profile Info */}
            <div className="px-6 pb-6">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between -mt-16">
                <div className="flex flex-col sm:flex-row sm:items-end">
                  {/* Avatar */}
                  <div className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-800 bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-4xl font-bold text-gray-600 dark:text-gray-300">
                    {profileData.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Name and Role */}
                  <div className="mt-4 sm:mt-0 sm:ml-6">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                      {profileData.name}
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400 capitalize">
                      {profileData.role}
                    </p>
                    {isProvider && (
                      <div className="flex items-center mt-2">
                        <Star className="w-5 h-5 text-yellow-400 fill-current" />
                        <span className="ml-1 text-lg font-semibold text-gray-900 dark:text-white">
                          {profileData.rating}
                        </span>
                        <span className="ml-2 text-gray-600 dark:text-gray-400">
                          ({profileData.reviewsCount} reviews)
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Edit Button */}
                <Link
                  href={ROUTES.DASHBOARD_PROFILE_EDIT}
                  className="mt-4 sm:mt-0"
                >
                  <Button>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="mt-8 grid md:grid-cols-3 gap-8">
            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contact Info */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Contact Information
                </h2>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <Mail className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-500">Email</p>
                      <p className="text-gray-900 dark:text-white">{profileData.email}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Phone className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-500">Phone</p>
                      <p className="text-gray-900 dark:text-white">{profileData.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <MapPin className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-500">Location</p>
                      <p className="text-gray-900 dark:text-white">{profileData.location}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Calendar className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-500">Member Since</p>
                      <p className="text-gray-900 dark:text-white">{profileData.joined}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats (for providers) */}
              {isProvider && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Statistics
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Jobs Completed</span>
                        <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                          {profileData.jobsCompleted}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Total Reviews</span>
                        <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                          {profileData.reviewsCount}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Average Rating</span>
                        <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                          {profileData.rating}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Quick Actions
                </h2>
                <div className="space-y-2">
                  <Link
                    href={ROUTES.DASHBOARD_SETTINGS}
                    className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition"
                  >
                    Settings
                  </Link>
                  <Link
                    href={ROUTES.DASHBOARD_SETTINGS_PASSWORD}
                    className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition"
                  >
                    Change Password
                  </Link>
                  {isProvider && (
                    <Link
                      href={ROUTES.DASHBOARD}
                      className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition"
                    >
                      My Dashboard
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="md:col-span-2 space-y-6">
              {/* About */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  About
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {profileData.bio}
                </p>
              </div>

              {/* Services (for providers) */}
              {isProvider && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <Briefcase className="w-5 h-5 mr-2" />
                    Services Offered
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-full text-sm">
                      Home Cleaning
                    </span>
                    <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-full text-sm">
                      Plumbing
                    </span>
                    <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-full text-sm">
                      Electrical Work
                    </span>
                  </div>
                </div>
              )}

              {/* Recent Reviews */}
              {isProvider && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Recent Reviews
                  </h2>
                  <div className="space-y-4">
                    {[1, 2, 3].map((_, index) => (
                      <div key={index} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0">
                        <div className="flex items-center mb-2">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < 5 ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                            2 days ago
                          </span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 text-sm">
                          Excellent service! Very professional and completed the job on time.
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                          - Customer Name
                        </p>
                      </div>
                    ))}
                    <Link
                      href="/reviews"
                      className="inline-block text-primary-600 dark:text-primary-400 hover:underline text-sm font-medium"
                    >
                      View all reviews →
                    </Link>
                  </div>
                </div>
              )}

              {/* Certifications (for providers) */}
              {isProvider && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <Award className="w-5 h-5 mr-2" />
                    Certifications & Licenses
                  </h2>
                  <div className="space-y-3">
                    <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <Award className="w-5 h-5 text-primary-600 dark:text-primary-400 mr-3" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          Licensed Plumber
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-500">
                          Valid until Dec 2026
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <Award className="w-5 h-5 text-primary-600 dark:text-primary-400 mr-3" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          Certified Electrician
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-500">
                          Valid until Mar 2027
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
