'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import { ErrorState } from '@/components/ui/ErrorState';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { adminService } from '@/services/admin-service';
import { formatCurrency } from '@/utils/helpers';
import {
  Users, Briefcase, ClipboardList, CreditCard, TrendingUp, TrendingDown,
  BarChart2, Activity, Calendar,
} from 'lucide-react';

function StatCard({
  label, value, sub, icon: Icon, trend,
}: {
  label: string; value: string | number; sub?: string;
  icon: any; trend?: 'up' | 'down' | 'neutral';
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
            <Icon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
          </div>
          {trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
          {trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
        </div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
        {sub && <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

const DAY_OPTIONS = [
  { label: '7 days', value: 7 },
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 },
];

export default function AdminAnalyticsPage() {
  const { user } = useAuth();
  const [days, setDays] = useState(30);

  const { data: userStats, isLoading: l1, error: e1, refetch: r1 } = useQuery({
    queryKey: ['admin-user-stats'],
    queryFn: () => adminService.getSystemStats(),
    enabled: user?.role === 'admin',
    staleTime: 60_000,
  });

  const { data: jobStats, isLoading: l2 } = useQuery({
    queryKey: ['admin-job-stats'],
    queryFn: () => adminService.getJobStats(),
    enabled: user?.role === 'admin',
    staleTime: 60_000,
  });

  const { data: requestStats, isLoading: l3 } = useQuery({
    queryKey: ['admin-request-stats'],
    queryFn: () => adminService.getRequestStats(),
    enabled: user?.role === 'admin',
    staleTime: 60_000,
  });

  const { data: paymentStats, isLoading: l4 } = useQuery({
    queryKey: ['admin-payment-stats'],
    queryFn: () => adminService.getPaymentStats(),
    enabled: user?.role === 'admin',
    staleTime: 60_000,
  });

  const { data: disputeStats, isLoading: l5 } = useQuery({
    queryKey: ['admin-dispute-stats'],
    queryFn: () => adminService.getDisputeStats(),
    enabled: user?.role === 'admin',
    staleTime: 60_000,
  });

  const { data: dailyMetrics, isLoading: l6 } = useQuery({
    queryKey: ['admin-daily-metrics', days],
    queryFn: () => adminService.getDailyMetrics({ days }),
    enabled: user?.role === 'admin',
    staleTime: 60_000,
  });

  const isLoading = l1 || l2 || l3 || l4 || l5;

  return (
    <ProtectedRoute requiredRoles={['admin']}>
      <Layout>
        <div className="container-custom py-12">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">
              Analytics & Metrics
            </h1>
            <p className="text-gray-600 dark:text-gray-400">Platform-wide performance metrics</p>
          </div>

          {e1 ? (
            <ErrorState title="Failed to load analytics" message="Please try again." retry={r1} />
          ) : isLoading ? (
            <Loading />
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <StatCard
                  label="Total Users"
                  value={userStats?.total ?? 0}
                  sub={`${userStats?.byRole?.provider ?? 0} providers · ${userStats?.byRole?.customer ?? 0} customers`}
                  icon={Users}
                />
                <StatCard
                  label="Total Jobs"
                  value={jobStats?.total ?? 0}
                  sub={`${jobStats?.byStatus?.completed ?? 0} completed`}
                  icon={Briefcase}
                  trend="up"
                />
                <StatCard
                  label="Open Requests"
                  value={requestStats?.byStatus?.open ?? 0}
                  sub={`${requestStats?.total ?? 0} total`}
                  icon={ClipboardList}
                />
                <StatCard
                  label="Revenue"
                  value={formatCurrency(paymentStats?.totalRevenue ?? 0)}
                  sub={`${paymentStats?.byStatus?.completed ?? 0} completed payments`}
                  icon={CreditCard}
                  trend="up"
                />
              </div>

              {/* Secondary stats row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                <StatCard
                  label="Active Users"
                  value={userStats?.byStatus?.active ?? 0}
                  sub={`${userStats?.byStatus?.suspended ?? 0} suspended`}
                  icon={Activity}
                />
                <StatCard
                  label="Jobs In Progress"
                  value={jobStats?.byStatus?.in_progress ?? 0}
                  icon={BarChart2}
                />
                <StatCard
                  label="Open Disputes"
                  value={disputeStats?.byStatus?.open ?? 0}
                  sub={`${disputeStats?.total ?? 0} total`}
                  icon={Activity}
                  trend={(disputeStats?.byStatus?.open ?? 0) > 5 ? 'up' : 'neutral'}
                />
                <StatCard
                  label="Failed Payments"
                  value={paymentStats?.byStatus?.failed ?? 0}
                  sub={`${paymentStats?.byStatus?.refunded ?? 0} refunded`}
                  icon={CreditCard}
                  trend={(paymentStats?.byStatus?.failed ?? 0) > 0 ? 'down' : 'neutral'}
                />
              </div>

              {/* Status breakdowns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                {/* Request statuses */}
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <ClipboardList className="h-5 w-5 text-primary-500" /> Service Requests by Status
                    </h3>
                    <div className="space-y-3">
                      {Object.entries(requestStats?.byStatus ?? {}).map(([status, count]) => {
                        const total = requestStats?.total || 1;
                        const pct = Math.round(((count as number) / total) * 100);
                        return (
                          <div key={status}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="capitalize text-gray-700 dark:text-gray-300">{status.replace('_', ' ')}</span>
                              <span className="font-medium text-gray-900 dark:text-white">{count as number} ({pct}%)</span>
                            </div>
                            <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div className="h-full bg-primary-500 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Job statuses */}
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-primary-500" /> Jobs by Status
                    </h3>
                    <div className="space-y-3">
                      {Object.entries(jobStats?.byStatus ?? {}).map(([status, count]) => {
                        const total = jobStats?.total || 1;
                        const pct = Math.round(((count as number) / total) * 100);
                        const color = status === 'completed' ? 'bg-green-500' : status === 'cancelled' ? 'bg-red-400' : 'bg-primary-500';
                        return (
                          <div key={status}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="capitalize text-gray-700 dark:text-gray-300">{status.replace('_', ' ')}</span>
                              <span className="font-medium text-gray-900 dark:text-white">{count as number} ({pct}%)</span>
                            </div>
                            <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Daily Metrics Table */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary-500" /> Daily Metrics
                    </h3>
                    <div className="flex gap-2">
                      {DAY_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => setDays(opt.value)}
                          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                            days === opt.value
                              ? 'bg-primary-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                          }`}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {l6 ? (
                    <div className="animate-pulse space-y-2">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-8 bg-gray-100 dark:bg-gray-700 rounded" />
                      ))}
                    </div>
                  ) : !dailyMetrics?.length ? (
                    <p className="text-sm text-gray-500 text-center py-8">No daily metrics data available</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-700">
                            {['Date', 'Users', 'Requests', 'Proposals', 'Jobs', 'Payments'].map(h => (
                              <th key={h} className="text-left py-2 px-3 text-gray-600 dark:text-gray-400 font-medium">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {[...(dailyMetrics ?? [])].reverse().slice(0, 30).map((row: any) => (
                            <tr key={row.date} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                              <td className="py-2 px-3 text-gray-900 dark:text-white font-medium">{row.date}</td>
                              <td className="py-2 px-3 text-gray-700 dark:text-gray-300">{row.total_users ?? 0}</td>
                              <td className="py-2 px-3 text-gray-700 dark:text-gray-300">{row.total_requests ?? 0}</td>
                              <td className="py-2 px-3 text-gray-700 dark:text-gray-300">{row.total_proposals ?? 0}</td>
                              <td className="py-2 px-3 text-gray-700 dark:text-gray-300">{row.total_jobs ?? 0}</td>
                              <td className="py-2 px-3 text-gray-700 dark:text-gray-300">{row.total_payments ?? 0}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
