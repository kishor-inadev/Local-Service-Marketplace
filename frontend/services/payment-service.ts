import { apiClient } from './api-client';

export interface Payment {
  id: string;
  job_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_method?: string;
  transaction_id?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  provider_id?: string;
  platform_fee?: number;
  provider_amount?: number;
  failed_reason?: string;
}

export interface CreatePaymentData {
  job_id: string;
  user_id: string;
  provider_id: string;
  amount: number;
  currency: 'USD' | 'EUR' | 'GBP' | 'INR';
  payment_method?: string;
  coupon_code?: string;
}

export interface RefundData {
  reason: string;
  amount?: number;
}

class PaymentService {
  async createPayment(data: CreatePaymentData): Promise<Payment> {
    const response = await apiClient.post<Payment>('/payments', data);
    return response.data;
  }

  async getPaymentById(id: string): Promise<Payment> {
    const response = await apiClient.get<Payment>(`/payments/${id}`);
    return response.data;
  }

  async getPaymentsByJob(jobId: string): Promise<Payment[]> {
    const response = await apiClient.get<Payment[]>(`/payments/jobs/${jobId}`);
    // API client unwraps standardized response
    return response.data || [];
  }

  async requestRefund(paymentId: string, data: RefundData): Promise<Payment> {
    const response = await apiClient.post<Payment>(`/payments/${paymentId}/refund`, data);
    return response.data;
  }

  async getMyPayments(): Promise<Payment[]> {
    const authState = JSON.parse(localStorage.getItem('auth-storage') || '{}');
    const userId = authState?.state?.user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }
    const response = await apiClient.get<Payment[]>(`/payments/my?user_id=${userId}`);
    // API client unwraps standardized response
    return response.data || [];
  }

  async getPaymentStatus(id: string): Promise<Payment> {
    const response = await apiClient.get<Payment>(`/payments/${id}/status`);
    return response.data;
  }

  // ------------------ Payment Methods ------------------

  async getPaymentMethods(): Promise<SavedPaymentMethod[]> {
    const response = await apiClient.get<SavedPaymentMethod[]>('/payment-methods');
    // API client unwraps standardized response
    return response.data || [];
  }

  async setDefaultPaymentMethod(methodId: string): Promise<void> {
    await apiClient.put(`/payment-methods/${methodId}/set-default`);
  }

  async deletePaymentMethod(methodId: string): Promise<void> {
    await apiClient.delete(`/payment-methods/${methodId}`);
  }

  // ------------------ Subscriptions ------------------

  async getProviderSubscriptions(providerId: string): Promise<Subscription[]> {
    const response = await apiClient.get<Subscription[]>(`/subscriptions/provider/${providerId}`);
    // API client unwraps standardized response
    return response.data || [];
  }

  async getActiveSubscription(providerId: string): Promise<Subscription | null> {
    const response = await apiClient.get<Subscription | null>(
      `/subscriptions/provider/${providerId}/active`
    );
    return response.data;
  }

  async cancelSubscription(subscriptionId: string): Promise<Subscription> {
    const response = await apiClient.put<Subscription>(`/subscriptions/${subscriptionId}/cancel`);
    return response.data;
  }

  // ------------------ Pricing Plans ------------------

  async getActivePricingPlans(): Promise<PricingPlan[]> {
    const response = await apiClient.get<PricingPlan[]>('/pricing-plans/active');
    // API client unwraps standardized response
    return response.data || [];
  }

  // ------------------ Provider Earnings ------------------

  async getProviderEarnings(
    startDate?: Date,
    endDate?: Date
  ): Promise<ProviderEarnings> {
    const authState = JSON.parse(localStorage.getItem('auth-storage') || '{}');
    const userId = authState?.state?.user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const params: any = {};
    if (startDate) params.start_date = startDate.toISOString();
    if (endDate) params.end_date = endDate.toISOString();

    const response = await apiClient.get<ProviderEarnings>(
      `/payments/provider/${userId}/earnings`,
      { params }
    );
    return response.data;
  }

  async getProviderTransactions(
    limit: number = 20,
    cursor?: string,
    status?: string
  ): Promise<PaginatedTransactions> {
    const authState = JSON.parse(localStorage.getItem('auth-storage') || '{}');
    const userId = authState?.state?.user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const params: any = { limit };
    if (cursor) params.cursor = cursor;
    if (status) params.status = status;

    const response = await apiClient.get<PaginatedTransactions>(
      `/payments/provider/${userId}/transactions`,
      { params }
    );
    return response.data;
  }

  async getProviderPayouts(): Promise<Payout[]> {
    const authState = JSON.parse(localStorage.getItem('auth-storage') || '{}');
    const userId = authState?.state?.user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const response = await apiClient.get<Payout[]>(
      `/payments/provider/${userId}/payouts`
    );
    return response.data || [];
  }
}

export interface SavedPaymentMethod {
  id: string;
  user_id: string;
  payment_type: 'card' | 'bank_account' | 'paypal' | 'other';
  card_brand?: string;
  last_four?: string;
  expiry_month?: number;
  expiry_year?: number;
  is_default: boolean;
  billing_email?: string;
  gateway_customer_id?: string;
  gateway_payment_method_id?: string;
  created_at: string;
}

export interface Subscription {
  id: string;
  provider_id: string;
  plan_id: string;
  plan_name?: string;  // Joined from pricing_plans
  plan_price?: number;  // Joined from pricing_plans
  billing_period?: string;  // Joined from pricing_plans
  status: 'active' | 'cancelled' | 'expired' | 'pending';
  started_at: string;
  expires_at?: string;
  cancelled_at?: string;
  created_at: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  description?: string;
  price: number;
  billing_period: 'monthly' | 'yearly';
  features?: Record<string, any>;
  active: boolean;
  created_at: string;
}

export interface ProviderEarnings {
  summary: {
    total_earnings: number;
    total_paid: number;
    pending_payout: number;
    completed_count: number;
    currency: string;
  };
  monthly: Array<{
    month: string;
    earnings: number;
    job_count: number;
  }>;
  average_per_job: number;
}

export interface Transaction {
  id: string;
  job_id: string;
  customer_id: string;
  provider_amount: number;
  platform_fee: number;
  total_amount: number;
  status: string;
  payment_method: string;
  transaction_id: string;
  created_at: string;
  paid_at?: string;
  customer_name: string;
}

export interface PaginatedTransactions {
  data: Transaction[];
  total: number;
  cursor?: string;
}

export interface Payout {
  id: string;
  amount: number;
  status: string;
  payout_method: string;
  payout_date: string;
  transaction_count: number;
}

export const paymentService = new PaymentService();
