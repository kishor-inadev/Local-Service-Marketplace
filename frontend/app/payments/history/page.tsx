'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/layout/Layout';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/Badge';
import { paymentService } from '@/services/payment-service';
import { formatDate, formatCurrency } from '@/utils/helpers';
import { analytics } from '@/utils/analytics';
import toast from 'react-hot-toast';
import { DollarSign, Download } from 'lucide-react';

export default function PaymentHistoryPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);
  const { data: payments, isLoading } = useQuery({
    queryKey: ['payment-history'],
    queryFn: () => paymentService.getMyPayments(),
    enabled: isAuthenticated,
  });

  useEffect(() => {
    analytics.pageview({
      path: '/payments/history',
      title: 'Payment History',
    });
  }, []);

  if (authLoading) {
    return <Loading />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Layout>
      <div className="container-custom py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Payment History
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              View all your payment transactions
            </p>
          </div>
        </div>

        {isLoading ? (
          <Loading />
        ) : payments && payments.length > 0 ? (
          <div className="space-y-4">
            {payments.map((payment: any) => (
              <Card key={payment.id} hover>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="p-3 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
                        <DollarSign className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {formatCurrency(payment.amount)}
                          </h3>
                          <StatusBadge status={payment.status} />
                        </div>
                        
                        <div className="mt-2 space-y-1">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Job ID: #{payment.job_id?.slice(0, 8)}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Transaction ID: #{payment.id.slice(0, 8)}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-500">
                            {formatDate(payment.created_at)}
                          </p>
                        </div>

                        {payment.status === 'completed' && payment.transaction_id && (
                          <div className="mt-3">
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                              Transaction ID: {payment.transaction_id}
                            </p>
                          </div>
                        )}

                        {payment.status === 'failed' && (
                          <div className="mt-3 px-3 py-2 bg-red-50 dark:bg-red-900/20 rounded-md">
                            <p className="text-sm text-red-700 dark:text-red-400">
                              Payment failed. Please contact support if you have questions.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <button
                        className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center gap-1"
                        onClick={() => {
                          analytics.event({
                            action: 'download_receipt',
                            category: 'engagement',
                            label: payment.id,
                          });
                          // Implement receipt download
                          console.log('Download receipt for payment:', payment.id);
                        }}
                      >
                        <Download className="h-4 w-4" />
                        Receipt
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No payments yet"
            description="Your payment history will appear here once you complete transactions."
          />
        )}
      </div>
    </Layout>
  );
}
