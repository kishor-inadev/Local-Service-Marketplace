'use client';

import { useRouter } from 'next/navigation';
import { PricingPlans } from '@/components/features/subscription/PricingPlans';

export function PricingSection() {
	const router = useRouter();
	return (
		<PricingPlans onSelectPlan={(planId) => router.push(`/checkout?plan=${planId}`)} />
	);
}
