"use client";

import CustomerDashboard from "@/components/dashboard/CustomerDashboard";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";

export default function CustomerOverviewPage() {
	return (
		<ProtectedRoute requiredRoles={["customer"]}>
			<CustomerDashboard />
		</ProtectedRoute>
	);
}
