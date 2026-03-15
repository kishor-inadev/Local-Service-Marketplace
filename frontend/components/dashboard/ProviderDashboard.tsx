'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/config/constants';
import { Layout } from '@/components/layout/Layout';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { proposalService } from '@/services/proposal-service';
import { jobService } from '@/services/job-service';
import { formatDate, formatCurrency } from '@/utils/helpers';
import Link from 'next/link';
import {
  Plus,
  Briefcase,
  FileText,
  DollarSign,
  Search,
  Calendar,
  TrendingUp,
  User,
  Star,
  ImageIcon,
} from 'lucide-react';

export default function ProviderDashboard() {
  const { user, isAuthenticated } = useAuth();

  const { data: proposals, isLoading: proposalsLoading } = useQuery({
    queryKey: ['my-proposals'],
    queryFn: () => proposalService.getMyProposals(),
    enabled: isAuthenticated,
  });

  const { data: jobs, isLoading: jobsLoading } = useQuery({
    queryKey: ['provider-jobs'],
    queryFn: () => jobService.getMyJobs(),
    enabled: isAuthenticated,
  });

  // Calculate earnings from completed jobs
  const totalEarnings =
    jobs?.filter((j: any) => j.status === 'completed').reduce((sum: number, job: any) => sum + (job.actual_amount || 0), 0) || 0;

  const pendingProposals = proposals?.filter((p: any) => p.status === 'pending').length || 0;
  const activeJobs = jobs?.filter((j: any) => j.status === 'in_progress').length || 0;

  return (
    <Layout>
      <div className="container-custom py-12">
        {/* Welcome Section */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-3">
            Welcome back, {user?.name || user?.email}!
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Manage your service business and grow your income
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card hover>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Pending Proposals
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {pendingProposals}
                </p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </CardContent>
          </Card>

          <Card hover>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Jobs</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {activeJobs}
                </p>
              </div>
              <Briefcase className="h-8 w-8 text-green-600" />
            </CardContent>
          </Card>

          <Card hover>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Earnings
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {formatCurrency(totalEarnings)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-primary-600" />
            </CardContent>
          </Card>

          <Card hover>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Success Rate
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {proposals && proposals.length > 0
                    ? Math.round(
                        (proposals.filter((p) => p.status === 'accepted').length /
                          proposals.length) *
                          100
                      )
                    : 0}
                  %
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-yellow-600" />
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mb-8">
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Actions</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href={ROUTES.DASHBOARD_BROWSE_REQUESTS || '/dashboard/browse-requests'}>
                <Button variant="outline" className="w-full justify-start">
                  <Search className="h-4 w-4 mr-2" />
                  Browse Service Requests
                </Button>
              </Link>
              <Link href={ROUTES.DASHBOARD_MY_PROPOSALS || '/dashboard/my-proposals'}>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  View My Proposals
                </Button>
              </Link>
              <Link href={ROUTES.DASHBOARD_AVAILABILITY || '/dashboard/availability'}>
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  Set Availability
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Provider Profile Management */}
        <Card className="mb-8">
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Profile Management</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Link href={ROUTES.DASHBOARD_PROVIDER_OVERVIEW}>
                <Button variant="outline" className="w-full justify-start">
                  <User className="h-4 w-4 mr-2" />
                  Overview
                </Button>
              </Link>
              <Link href={ROUTES.DASHBOARD_PROVIDER_PORTFOLIO}>
                <Button variant="outline" className="w-full justify-start">
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Portfolio
                </Button>
              </Link>
              <Link href={ROUTES.DASHBOARD_PROVIDER_REVIEWS}>
                <Button variant="outline" className="w-full justify-start">
                  <Star className="h-4 w-4 mr-2" />
                  Reviews
                </Button>
              </Link>
              <Link href={ROUTES.DASHBOARD_PROVIDER_DOCUMENTS}>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Documents
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Proposals */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Recent Proposals
                </h2>
                <Link href={ROUTES.DASHBOARD_MY_PROPOSALS || '/dashboard/my-proposals'}>
                  <Button variant="outline" size="sm">
                    View All
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {proposalsLoading ? (
                <Loading size="sm" />
              ) : proposals && proposals.length > 0 ? (
                <div className="space-y-4">
                  {proposals.slice(0, 5).map((proposal) => (
                    <div
                      key={proposal.id}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            Proposal #{proposal.id.substring(0, 8)}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                            {proposal.message}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                            <span>{formatCurrency(proposal.price)}</span>
                            <span>•</span>
                            <span>{formatDate(proposal.created_at)}</span>
                          </div>
                        </div>
                        <StatusBadge status={proposal.status} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <p>No proposals submitted yet</p>
                  <Link href={ROUTES.DASHBOARD_BROWSE_REQUESTS || '/dashboard/browse-requests'}>
                    <Button variant="outline" size="sm" className="mt-4">
                      Browse Requests
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
                  {jobs
                    .filter((j: any) => j.status === 'in_progress')
                    .slice(0, 5)
                    .map((job: any) => (
                      <Link
                        key={job.id}
                        href={`/jobs/${job.id}`}
                        className="block p-4 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900 dark:text-white">
                              Job #{job.id.slice(0, 8)}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {job.customer?.name || 'Customer'}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                              <span>{formatCurrency(job.actual_amount || 0)}</span>
                              <span>•</span>
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

        {/* Earnings Overview */}
        <Card className="mt-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Earnings Overview
              </h2>
              <Link href={ROUTES.DASHBOARD_EARNINGS || '/dashboard/earnings'}>
                <Button variant="outline" size="sm">
                  View Details
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-sm font-medium text-green-800 dark:text-green-300">
                  Completed Jobs
                </p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-200 mt-2">
                  {jobs?.filter((j: any) => j.status === 'completed').length || 0}
                </p>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                  Jobs in Progress
                </p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-200 mt-2">
                  {activeJobs}
                </p>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <p className="text-sm font-medium text-purple-800 dark:text-purple-300">
                  Pending Proposals
                </p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-200 mt-2">
                  {pendingProposals}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
