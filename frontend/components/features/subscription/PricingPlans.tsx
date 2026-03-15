'use client';

import { useState, useEffect } from 'react';
import { Check, Zap, Star, Crown } from 'lucide-react';
import { paymentService, type PricingPlan } from '@/services/payment-service';

export function PricingPlans({ onSelectPlan }: { onSelectPlan?: (planId: string) => void }) {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const data = await paymentService.getActivePricingPlans();
      setPlans(data || []);
    } catch (error) {
      console.error('Failed to load pricing plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPlanIcon = (planName: string) => {
    const name = planName.toLowerCase();
    if (name.includes('free') || name.includes('basic')) {
      return <Zap className="w-8 h-8" />;
    } else if (name.includes('pro') || name.includes('professional')) {
      return <Star className="w-8 h-8" />;
    } else if (name.includes('premium') || name.includes('enterprise')) {
      return <Crown className="w-8 h-8" />;
    }
    return <Zap className="w-8 h-8" />;
  };

  const isPlanPopular = (planName: string) => {
    return planName.toLowerCase().includes('pro') || planName.toLowerCase().includes('professional');
  };

  const formatFeature = (key: string, value: any): string => {
    if (typeof value === 'boolean') {
      return key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }
    return `${key}: ${value}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const filteredPlans = plans.filter(plan => plan.billing_period === billingPeriod);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold mb-4 dark:text-gray-100">Choose Your Plan</h2>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
          Select the perfect plan for your business needs
        </p>

        {/* Billing Period Toggle */}
        <div className="inline-flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setBillingPeriod('monthly')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              billingPeriod === 'monthly'
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingPeriod('yearly')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              billingPeriod === 'yearly'
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            Yearly
            <span className="ml-2 text-xs bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 px-2 py-0.5 rounded-full">
              Save 20%
            </span>
          </button>
        </div>
      </div>

      {filteredPlans.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No {billingPeriod} plans available</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPlans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-2xl shadow-lg overflow-hidden transition-transform hover:scale-105 ${
                isPlanPopular(plan.name) ? 'ring-2 ring-blue-600' : ''
              }`}
            >
              {/* Header */}
              <div className={`p-8 ${
                isPlanPopular(plan.name)
                  ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white'
                  : 'bg-gray-50'
              }`}>
                {isPlanPopular(plan.name) && (
                  <div className="mb-4">
                    <span className="inline-block px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                  isPlanPopular(plan.name)
                    ? 'bg-white bg-opacity-20'
                    : 'bg-blue-600 text-white'
                }`}>
                  {getPlanIcon(plan.name)}
                </div>

                <h3 className={`text-2xl font-bold mb-2 ${
                  isPlanPopular(plan.name) ? 'text-white' : 'text-gray-900'
                }`}>
                  {plan.name}
                </h3>

                {plan.description && (
                  <p className={`text-sm ${
                    isPlanPopular(plan.name) ? 'text-white text-opacity-90' : 'text-gray-600'
                  }`}>
                    {plan.description}
                  </p>
                )}

                <div className="mt-6">
                  <div className="flex items-baseline gap-1">
                    <span className={`text-4xl font-bold ${
                      isPlanPopular(plan.name) ? 'text-white' : 'text-gray-900'
                    }`}>
                      ${plan.price}
                    </span>
                    <span className={`${
                      isPlanPopular(plan.name) ? 'text-white text-opacity-75' : 'text-gray-600'
                    }`}>
                      /{billingPeriod === 'monthly' ? 'mo' : 'yr'}
                    </span>
                  </div>
                  {billingPeriod === 'yearly' && (
                    <p className={`text-sm mt-1 ${
                      isPlanPopular(plan.name) ? 'text-white text-opacity-75' : 'text-gray-500'
                    }`}>
                      ${(plan.price / 12).toFixed(2)}/month billed annually
                    </p>
                  )}
                </div>
              </div>

              {/* Features */}
              <div className="p-8">
                <ul className="space-y-4">
                  {plan.features && Object.entries(plan.features).map(([key, value]) => (
                    <li key={key} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">
                        {formatFeature(key, value)}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => onSelectPlan && onSelectPlan(plan.id)}
                  className={`w-full mt-8 px-6 py-3 rounded-lg font-semibold transition-colors ${
                    isPlanPopular(plan.name)
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  {plan.price === 0 ? 'Get Started' : 'Subscribe Now'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FAQ/Info Section */}
      <div className="mt-16 text-center">
        <p className="text-gray-600">
          All plans include 24/7 support and a 30-day money-back guarantee.
          <br />
          Need help choosing? <a href="/contact" className="text-blue-600 hover:underline">Contact our sales team</a>
        </p>
      </div>
    </div>
  );
}
