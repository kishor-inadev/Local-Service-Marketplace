'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Calendar, CreditCard, AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { paymentService, type Subscription } from '@/services/payment-service';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

export function SubscriptionManagement({ providerId }: { providerId: string }) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [activeSubscription, setActiveSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [pendingSubId, setPendingSubId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const loadSubscriptions = useCallback(async () => {
    try {
      const [subs, active] = await Promise.all([
        paymentService.getProviderSubscriptions(providerId),
        paymentService.getActiveSubscription(providerId)
      ]);

      setSubscriptions(subs || []);
      setActiveSubscription(active || null);
    } catch (error) {
      console.error('Failed to load subscriptions:', error);
    } finally {
      setLoading(false);
    }
  }, [providerId]);
  useEffect(() => {
    loadSubscriptions();
  }, [providerId, loadSubscriptions]);



  const handleCancelClick = (subscriptionId: string) => {
    setPendingSubId(subscriptionId);
    setCancelConfirmOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!pendingSubId) return;
    setCancelling(true);
    try {
      await paymentService.cancelSubscription(pendingSubId);
      loadSubscriptions();
      toast.success('Subscription cancelled successfully. You will retain access until the end of your billing period.');
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      toast.error('Failed to cancel subscription');
    } finally {
      setCancelling(false);
      setCancelConfirmOpen(false);
      setPendingSubId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 text-sm font-medium rounded-full">
            <CheckCircle className="w-4 h-4" />
            Active
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-300 text-sm font-medium rounded-full">
            <AlertCircle className="w-4 h-4" />
            Cancelled
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300 text-sm font-medium rounded-full">
            <XCircle className="w-4 h-4" />
            Expired
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300 text-sm font-medium rounded-full">
            <Clock className="w-4 h-4" />
            Pending
          </span>
        );
      default:
        return null;
    }
  };

  const getDaysRemaining = (expiresAt?: string) => {
    if (!expiresAt) return null;
    const expiry = new Date(expiresAt);
    const now = new Date();
    const days = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className='max-w-4xl mx-auto space-y-6'>
        {/* Active Subscription Card */}
        {activeSubscription ?
          <div className='bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg shadow-lg p-8 text-white'>
            <div className='flex items-start justify-between mb-6'>
              <div>
                <h3 className='text-2xl font-bold mb-2'>{activeSubscription.plan_name || "Current Plan"}</h3>
                <p className='text-blue-100'>Your active subscription</p>
              </div>
              {getStatusBadge(activeSubscription.status)}
            </div>

            <div className='grid md:grid-cols-3 gap-6 mb-6'>
              <div>
                <p className='text-blue-200 text-sm mb-1'>Price</p>
                <p className='text-3xl font-bold'>
                  ₹{activeSubscription.plan_price || 0}
                  <span className='text-lg font-normal'>/{activeSubscription.billing_period || "month"}</span>
                </p>
              </div>

              <div>
                <p className='text-blue-200 text-sm mb-1'>Started</p>
                <p className='text-xl font-semibold'>{new Date(activeSubscription.started_at).toLocaleDateString()}</p>
              </div>

              {activeSubscription.expires_at && (
                <div>
                  <p className='text-blue-200 text-sm mb-1'>
                    {activeSubscription.status === "cancelled" ? "Access Until" : "Renews On"}
                  </p>
                  <p className='text-xl font-semibold'>{new Date(activeSubscription.expires_at).toLocaleDateString()}</p>
                  <p className='text-blue-200 text-sm mt-1'>
                    ({getDaysRemaining(activeSubscription.expires_at)} days remaining)
                  </p>
                </div>
              )}
            </div>

            {activeSubscription.status === "active" && !activeSubscription.cancelled_at && (
              <div className='flex gap-3'>
                <button
                  onClick={() => handleCancelClick(activeSubscription.id)}
                  className='px-6 py-2 bg-white dark:bg-gray-700 bg-opacity-20 dark:bg-opacity-40 hover:bg-opacity-30 dark:hover:bg-opacity-60 rounded-lg font-medium transition-colors'>
                  Cancel Subscription
                </button>
                <a
                  href='/pricing'
                  className='px-6 py-2 bg-white dark:bg-gray-100 text-blue-600 dark:text-blue-700 rounded-lg font-medium hover:bg-opacity-90 dark:hover:bg-gray-200 transition-colors'>
                  Upgrade Plan
                </a>
              </div>
            )}

            {activeSubscription.cancelled_at && (
              <div className='p-4 bg-white dark:bg-gray-700 bg-opacity-20 dark:bg-opacity-40 rounded-lg'>
                <p className='text-sm'>
                  <AlertCircle className='w-4 h-4 inline mr-2' />
                  Your subscription was cancelled on {new Date(activeSubscription.cancelled_at).toLocaleDateString()}. You
                  will retain access until{" "}
                  {activeSubscription.expires_at && new Date(activeSubscription.expires_at).toLocaleDateString()}.
                </p>
              </div>
            )}
          </div>
          : <div className='bg-white rounded-lg shadow-md p-12 text-center'>
            <CreditCard className='w-16 h-16 mx-auto mb-4 text-gray-300' />
            <h3 className='text-xl font-semibold mb-2'>No Active Subscription</h3>
            <p className='text-gray-600 mb-6'>Subscribe to a plan to unlock premium features and grow your business</p>
            <a
              href='/pricing'
              className='inline-block px-6 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 font-medium'>
              View Pricing Plans
            </a>
          </div>
        }

        {/* Subscription History */}
        {subscriptions.length > 0 && (
          <div className='bg-white rounded-lg shadow-md'>
            <div className='p-6 border-b border-gray-200'>
              <h3 className='text-xl font-semibold flex items-center gap-2'>
                <Calendar className='w-5 h-5' />
                Subscription History
              </h3>
            </div>

            <div className='divide-y divide-gray-200'>
              {subscriptions.map((subscription) => (
                <div
                  key={subscription.id}
                  className='p-6 hover:bg-gray-50 transition-colors'>
                  <div className='flex items-start justify-between'>
                    <div className='flex-1'>
                      <div className='flex items-center gap-3 mb-2'>
                        <h4 className='font-semibold text-gray-900'>{subscription.plan_name || "Subscription"}</h4>
                        {getStatusBadge(subscription.status)}
                      </div>

                      <div className='grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-gray-600'>
                        <div>
                          <span className='text-gray-500'>Price:</span> ₹{subscription.plan_price || 0}/
                          {subscription.billing_period || "month"}
                        </div>
                        <div>
                          <span className='text-gray-500'>Started:</span>{" "}
                          {new Date(subscription.started_at).toLocaleDateString()}
                        </div>
                        {subscription.expires_at && (
                          <div>
                            <span className='text-gray-500'>Expires:</span>{" "}
                            {new Date(subscription.expires_at).toLocaleDateString()}
                          </div>
                        )}
                        {subscription.cancelled_at && (
                          <div>
                            <span className='text-gray-500'>Cancelled:</span>{" "}
                            {new Date(subscription.cancelled_at).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className='bg-blue-50 border border-blue-200 rounded-lg p-6'>
          <h4 className='font-semibold text-blue-900 mb-2'>Need Help?</h4>
          <p className='text-sm text-blue-800 mb-4'>
            Have questions about your subscription? Our support team is here to help.
          </p>
          <a
            href='/contact'
            className='text-sm text-blue-600 hover:text-blue-700 font-medium'>
            Contact Support →
          </a>
        </div>
      </div>
      <ConfirmDialog
        isOpen={cancelConfirmOpen}
        onClose={() => { setCancelConfirmOpen(false); setPendingSubId(null); }}
        onConfirm={handleConfirmCancel}
        title="Cancel Subscription"
        message="Are you sure you want to cancel your subscription? You will retain access until the end of your billing period."
        confirmLabel="Cancel Subscription"
        variant="danger"
        isLoading={cancelling}
      />
    </>
  );
}

