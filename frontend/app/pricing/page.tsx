'use client';

import { useRouter } from 'next/navigation';
import { Layout } from '@/components/layout/Layout';
import { PricingPlans } from '@/components/features/subscription/PricingPlans';

export default function PricingPage() {
  const router = useRouter();

  const handleSelectPlan = (planId: string) => {
    // Redirect to subscription creation/checkout page
    router.push(`/checkout?plan=${planId}`);
  };

  return (
    <Layout>
      <div className="bg-gray-50 dark:bg-gray-900 py-12">
        <div className="container mx-auto px-4">
          <PricingPlans onSelectPlan={handleSelectPlan} />
        </div>
      </div>
    </Layout>
  );
}
