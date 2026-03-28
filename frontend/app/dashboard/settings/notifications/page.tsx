'use client';

import { SettingsLayout } from '@/components/layout/SettingsLayout';
import { NotificationPreferences } from '@/components/features/notifications/NotificationPreferences';
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";

function NotificationSettingsContent() {
	return (
		<SettingsLayout>
			<NotificationPreferences />
		</SettingsLayout>
	);
}

export default function NotificationSettingsPage() {
	return (
		<ProtectedRoute>
			<NotificationSettingsContent />
		</ProtectedRoute>
	);
}
