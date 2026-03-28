'use client';

import { SettingsLayout } from '@/components/layout/SettingsLayout';
import { PaymentMethods } from '@/components/features/payment/PaymentMethods';
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";

function PaymentMethodsContent() {
	return (
		<SettingsLayout>
			<PaymentMethods />
		</SettingsLayout>
	);
}

export default function PaymentMethodsPage() {
	return (
		<ProtectedRoute>
			<PaymentMethodsContent />
		</ProtectedRoute>
	);
}
