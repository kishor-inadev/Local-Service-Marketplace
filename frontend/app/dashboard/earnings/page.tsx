'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/config/constants';
import { Layout } from '@/components/layout/Layout';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import { Button } from '@/components/ui/Button';
import { paymentService } from '@/services/payment-service';
import { formatDate, formatCurrency } from '@/utils/helpers';
import { DollarSign, TrendingUp, Calendar, Download } from 'lucide-react';

export default function EarningsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [dateRange, setDateRange] = useState<string>('all');

  // Fetch provider's earnings from payment service
  const { data: earnings, isLoading: earningsLoading } = useQuery({
    queryKey: ['provider-earnings', dateRange],
    queryFn: () => {
      // Calculate date filters based on selected range
      let startDate: Date | undefined;
      let endDate: Date | undefined;
      const now = new Date();

      if (dateRange === 'this_month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = now;
      } else if (dateRange === 'last_month') {
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
      } else if (dateRange === 'this_year') {
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = now;
      }

      return paymentService.getProviderEarnings(startDate, endDate);
    },
    enabled: isAuthenticated && user?.role === 'provider',
  });

  // Fetch transaction history
  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['provider-transactions'],
    queryFn: () => paymentService.getProviderTransactions(50),
    enabled: isAuthenticated && user?.role === 'provider',
  });

  const isLoading = earningsLoading || transactionsLoading;

  if (!isAuthenticated || user?.role !== 'provider') {
    router.push(ROUTES.DASHBOARD);
    return null;
  }

  return (
    <Layout>
      <div className="container-custom py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">
            Earnings Dashboard
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Track your income and payment history
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card hover>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Earnings
                </p>
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {earnings ? formatCurrency(earnings.summary.total_earnings) : formatCurrency(0)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                From {earnings?.summary.completed_count || 0} completed jobs
              </p>
            </CardContent>
          </Card>

          <Card hover>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Paid
                </p>
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {earnings ? formatCurrency(earnings.summary.total_paid) : formatCurrency(0)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Payments received
              </p>
            </CardContent>
          </Card>

          <Card hover>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Average per Job
                </p>
                <DollarSign className="h-5 w-5 text-purple-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {earnings ? formatCurrency(earnings.average_per_job) : formatCurrency(0)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Across all jobs
              </p>
            </CardContent>
          </Card>

          <Card hover>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Pending Payout
                </p>
                <Calendar className="h-5 w-5 text-yellow-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {earnings ? formatCurrency(earnings.summary.pending_payout) : formatCurrency(0)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Awaiting payout
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Date Range Filter */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Time Period:
                </label>
                <select
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                >
                  <option value="all">All Time</option>
                  <option value="this_month">This Month</option>
                  <option value="last_month">Last Month</option>
                  <option value="this_year">This Year</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Earnings Breakdown */}
        {earnings && earnings.monthly.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Monthly Breakdown
              </h2>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {earnings.monthly.map((month) => (
                  <div key={month.month} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                      {new Date(month.month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(month.earnings)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {month.job_count} jobs
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Earnings History */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Transaction History
            </h2>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loading size="sm" />
            ) : transactions && transactions.data.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Date
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Transaction ID
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Customer
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Amount
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Platform Fee
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Your Earnings
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.data.map((transaction) => (
                      <tr
                        key={transaction.id}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                          {formatDate(transaction.paid_at || transaction.created_at)}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400 font-mono">
                          #{transaction.id.substring(0, 8)}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                          {transaction.customer_name || 'Customer'}
                        </td>
                        <td className="py-3 px-4 text-sm text-right text-gray-900 dark:text-white">
                          {formatCurrency(transaction.total_amount)}
                        </td>
                        <td className="py-3 px-4 text-sm text-right text-red-600 dark:text-red-400">
                          -{formatCurrency(transaction.platform_fee)}
                        </td>
                        <td className="py-3 px-4 text-sm text-right font-semibold text-green-600 dark:text-green-400">
                          {formatCurrency(transaction.provider_amount)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                            transaction.status === 'completed'
                              ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                              : transaction.status === 'pending'
                              ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                              : 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200'
                          }`}>
                            {transaction.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No earnings yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Complete jobs to start earning
                </p>
                <Button onClick={() => router.push(ROUTES.DASHBOARD_BROWSE_REQUESTS)}>
                  Browse Requests
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payout Methods Section */}
        <Card className="mt-6">
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Payout Methods
            </h2>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>Payout method management will be available soon</p>
              <p className="text-sm mt-2">Configure bank accounts and payment preferences</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
