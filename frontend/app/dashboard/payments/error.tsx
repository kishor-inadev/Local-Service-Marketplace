'use client';
import { RouteError } from '@/components/ui/RouteError';
export default function Error(props: Parameters<typeof RouteError>[0]) {
	return <RouteError {...props} message="Payment information couldn't be loaded. Please try again." />;
}
