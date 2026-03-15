'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/config/constants';
import { isNotificationsEnabled } from '@/config/features';
import { Layout } from '@/components/layout/Layout';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { requestService } from '@/services/request-service';
import { jobService } from '@/services/job-service';
import { notificationService } from '@/services/notification-service';
import { formatDate, formatCurrency } from '@/utils/helpers';
import { analytics } from '@/utils/analytics';
import Link from 'next/link';
import { Plus, Briefcase, FileText, Bell } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(ROUTES.LOGIN);
    }
  }, [isAuthenticated, authLoading, router]);

  const { data: requests, isLoading: requestsLoading } = useQuery({
    queryKey: ['my-requests'],
    queryFn: () => requestService.getMyRequests(),
    enabled: isAuthenticated,
  });

  const { data: jobs, isLoading: jobsLoading } = useQuery({
    queryKey: ['my-jobs'],
    queryFn: () => jobService.getMyJobs(),
    enabled: isAuthenticated,
  });

  const { data: notifications, isLoading: notificationsLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationService.getNotifications({ limit: 5 }),
    enabled: isAuthenticated && isNotificationsEnabled(),
  });

  // All hooks must be called before any conditional returns
  useEffect(() => {
    if (isAuthenticated) {
      analytics.pageview({
        path: '/dashboard',
        title: 'Dashboard',
      });
    }
  }, [isAuthenticated]);

  if (authLoading) {
    return <Loading />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Layout>
      <div className="container-custom py-12">
        {/* Welcome Section */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-3">
            Welcome back, {user?.email}!
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Here's what's happening with your services
          </p>
        </div>

        {/* Quick Actions */}
        <div className={`grid grid-cols-1 ${isNotificationsEnabled() ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-6 mb-12`}>
          <Card hover>
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Active Requests
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {requests?.filter((r) => r.status === 'open').length || 0}
                </p>
              </div>
              <FileText className="h-8 w-8 text-primary-600" />
            </CardContent>
          </Card>

          <Card hover>
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Jobs</p>
                <p className="text-2xl font-bold text-gray-900">
                  {jobs?.filter((j) => j.status === 'in_progress').length || 0}
                </p>
              </div>
              <Briefcase className="h-8 w-8 text-green-600" />
            </CardContent>
          </Card>

          {isNotificationsEnabled() && (
            <Card hover>
              <CardContent className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Notifications
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {notifications?.filter((n) => !n.read).length || 0}
                  </p>
                </div>
                <Bell className="h-8 w-8 text-yellow-600" />
              </CardContent>
            </Card>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Requests */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Recent Requests
                </h2>
                <Link href={ROUTES.CREATE_REQUEST}>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    New Request
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {requestsLoading ? (
                <Loading size="sm" />
              ) : requests && requests.length > 0 ? (
                <div className="space-y-4">
                  {requests.slice(0, 5).map((request) => (
                    <Link
                      key={request.id}
                      href={`/requests/${request.id}`}
                      className="block p-4 border dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            Request #{request.id.substring(0, 8)}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                            {request.description}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                            <span>{formatCurrency(request.budget)}</span>
                            <span>•</span>
                            <span>{formatDate(request.created_at)}</span>
                          </div>
                        </div>
                        <StatusBadge status={request.status} />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <p>No requests yet</p>
                  <Link href={ROUTES.CREATE_REQUEST}>
                    <Button variant="outline" size="sm" className="mt-4">
                      Create Your First Request
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Jobs */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Active Jobs
                </h2>
                <Link href={ROUTES.DASHBOARD_JOBS}>
                  <Button variant="outline" size="sm">
                    View All
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {jobsLoading ? (
                <Loading size="sm" />
              ) : jobs && jobs.length > 0 ? (
                <div className="space-y-4">
                  {jobs.slice(0, 5).map((job) => (
                    <Link
                      key={job.id}
                      href={`/jobs/${job.id}`}
                      className="block p-4 border dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            Job #{job.id.slice(0, 8)}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {job.provider?.name || 'Provider'}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                            <span>{formatDate(job.created_at)}</span>
                          </div>
                        </div>
                        <StatusBadge status={job.status} />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <p>No active jobs</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Notifications */}
        <Card className="mt-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recent Notifications
              </h2>
              <Link href={ROUTES.DASHBOARD_NOTIFICATIONS}>
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {notificationsLoading ? (
              <Loading size="sm" />
            ) : notifications && notifications.length > 0 ? (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-md ${
                      notification.read ? 'bg-gray-50 dark:bg-gray-700' : 'bg-blue-50 dark:bg-blue-900/20'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <h4 className="font-medium text-gray-900 dark:text-white capitalize">
                        {notification.type.replace(/_/g, ' ')}
                      </h4>
                      {!notification.read && (
                        <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {formatDate(notification.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No notifications</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
