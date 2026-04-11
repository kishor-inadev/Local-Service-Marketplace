'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { CreditCard, Plus, Check, Trash2, AlertTriangle, Calendar, Shield } from 'lucide-react';
import { paymentService, type SavedPaymentMethod } from '@/services/payment-service';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

export function PaymentMethods() {
  const [methods, setMethods] = useState<SavedPaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [pendingMethodId, setPendingMethodId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      const data = await paymentService.getPaymentMethods();
      setMethods(data || []);
    } catch (error) {
      console.error('Failed to load payment methods:', error);
    } finally {
      setLoading(false);
    }
  };

  const setDefault = async (methodId: string) => {
    try {
      await paymentService.setDefaultPaymentMethod(methodId);
      loadPaymentMethods();
    } catch (error) {
      console.error('Failed to set default:', error);
      toast.error('Failed to set default payment method');
    }
  };

  const handleDeleteClick = (methodId: string) => {
    setPendingMethodId(methodId);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!pendingMethodId) return;
    setDeleting(true);
    try {
      await paymentService.deletePaymentMethod(pendingMethodId);
      loadPaymentMethods();
    } catch (error) {
      console.error('Failed to delete payment method:', error);
      toast.error('Failed to delete payment method');
    } finally {
      setDeleting(false);
      setDeleteConfirmOpen(false);
      setPendingMethodId(null);
    }
  };

  const getCardIcon = (brand?: string) => {
    switch (brand?.toLowerCase()) {
      case 'visa':
        return '💳 Visa';
      case 'mastercard':
        return '💳 Mastercard';
      case 'amex':
        return '💳 American Express';
      case 'discover':
        return '💳 Discover';
      default:
        return '💳 Card';
    }
  };

  const isExpired = (month?: number, year?: number) => {
    if (!month || !year) return false;
    const now = new Date();
    const expiry = new Date(year, month);
    return expiry < now;
  };

  const isExpiringSoon = (month?: number, year?: number) => {
    if (!month || !year) return false;
    const now = new Date();
    const expiry = new Date(year, month);
    const twoMonthsFromNow = new Date();
    twoMonthsFromNow.setMonth(now.getMonth() + 2);
    return expiry > now && expiry <= twoMonthsFromNow;
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
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                <CreditCard className="w-6 h-6" />
                Payment Methods
              </h2>
              <p className="text-gray-600 text-sm">
                Manage your saved payment methods securely
              </p>
            </div>
            
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Payment Method
            </button>
          </div>
        </div>

        {/* Security Notice */}
        <div className="p-4 bg-green-50 border-b border-green-200 flex items-start gap-3">
          <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-green-800">
              <strong>Secure Storage:</strong> Your payment information is encrypted and 
              securely stored. We never store your full card number.
            </p>
          </div>
        </div>

        {/* Payment Methods List */}
        {methods.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <CreditCard className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="mb-2">No payment methods saved</p>
            <p className="text-sm">Add a payment method to make checkout faster</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {methods.map((method) => (
              <div key={method.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center text-white text-2xl">
                      💳
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">
                          {method.payment_type === 'card' && method.card_brand
                            ? getCardIcon(method.card_brand)
                            : method.payment_type === 'paypal'
                            ? '💰 PayPal'
                            : '💳 Payment Method'}
                        </h3>
                        
                        {method.is_default && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 text-xs font-medium rounded-full">
                            <Check className="w-3 h-3" />
                            Default
                          </span>
                        )}

                        {isExpired(method.expiry_month, method.expiry_year) && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300 text-xs font-medium rounded-full">
                            <AlertTriangle className="w-3 h-3" />
                            Expired
                          </span>
                        )}

                        {isExpiringSoon(method.expiry_month, method.expiry_year) && !isExpired(method.expiry_month, method.expiry_year) && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-300 text-xs font-medium rounded-full">
                            <Calendar className="w-3 h-3" />
                            Expiring Soon
                          </span>
                        )}
                      </div>

                      {method.payment_type === 'card' && method.last_four && (
                        <p className="text-gray-600 text-sm mb-1">
                          •••• •••• •••• {method.last_four}
                        </p>
                      )}

                      {method.expiry_month && method.expiry_year && (
                        <p className="text-gray-500 text-sm">
                          Expires {method.expiry_month.toString().padStart(2, '0')}/{method.expiry_year}
                        </p>
                      )}

                      {method.billing_email && (
                        <p className="text-gray-500 text-sm mt-1">{method.billing_email}</p>
                      )}

                      <p className="text-gray-400 text-xs mt-2">
                        Added {new Date(method.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!method.is_default && (
                      <button
                        onClick={() => setDefault(method.id)}
                        className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300"
                      >
                        Set as Default
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleDeleteClick(method.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Box */}
        <div className="p-6 bg-blue-50 border-t border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Your default payment method will be used for automatic 
            payments and quick checkout. You can change it anytime.
          </p>
        </div>
      </div>

      {/* Add Payment Method Modal */}
      {showAddForm && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowAddForm(false)}
        >
          <div 
            className="bg-white rounded-lg max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold mb-4">Add Payment Method</h3>
            
            <div className="p-8 text-center text-gray-600">
              <Shield className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="mb-4">
                Payment method integration with Stripe, PayPal, or other payment gateways 
                would be implemented here.
              </p>
              <p className="text-sm">
                This requires connecting to your payment gateway's SDK and tokenization service.
              </p>
            </div>

            <button
              onClick={() => setShowAddForm(false)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
    <ConfirmDialog
      isOpen={deleteConfirmOpen}
      onClose={() => { setDeleteConfirmOpen(false); setPendingMethodId(null); }}
      onConfirm={handleConfirmDelete}
      title="Delete Payment Method"
      message="Are you sure you want to delete this payment method? This action cannot be undone."
      confirmLabel="Delete"
      variant="danger"
      isLoading={deleting}
    />
    </>
  );
}
