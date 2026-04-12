'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { ROUTES } from '@/config/constants';
import { Loading } from '@/components/ui/Loading';


type Role = "customer" | "provider" | "admin";
interface ProtectedRouteProps {
	children: React.ReactNode;
	requireAuth?: boolean;
	/** @deprecated Use requiredPermissions instead */
	requiredRoles?: Role[];
	/** User must have at least one of these permissions */
	requiredPermissions?: string[];
	redirectTo?: string;
}

export function ProtectedRoute({
	children,
	requireAuth = true,
	requiredRoles,
	requiredPermissions,
	redirectTo = ROUTES.LOGIN,
}: ProtectedRouteProps) {
	const router = useRouter();
	const { isAuthenticated, user, isLoading } = useAuth();
	const { canAny } = usePermissions();
	const [isAuthorized, setIsAuthorized] = useState(false);

	useEffect(() => {
		if (isLoading) return;

		// Check authentication
		if (requireAuth && !isAuthenticated) {
			router.push(redirectTo);
			return;
		}

		// Prefer permission-based check
		if (requiredPermissions && requiredPermissions.length > 0) {
			if (!canAny(requiredPermissions)) {
				router.push(ROUTES.DASHBOARD);
				return;
			}
		}
		// Fallback: legacy role-based check
		else if (requiredRoles && requiredRoles.length > 0) {
			if (!user?.role || !requiredRoles.includes(user.role as Role)) {
				router.push(ROUTES.DASHBOARD);
				return;
			}
		}

		setIsAuthorized(true);
	}, [isAuthenticated, user, isLoading, requireAuth, requiredRoles, requiredPermissions, canAny, router, redirectTo]);

	if (isLoading) {
		return (
			<div className='min-h-screen flex items-center justify-center'>
				<Loading />
			</div>
		);
	}

	if (!isAuthorized) {
		return null;
	}

	return <>{children}</>;
}
