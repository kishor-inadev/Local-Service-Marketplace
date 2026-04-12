'use client';
import { RouteError } from '@/components/ui/RouteError';
export default function Error(props: Parameters<typeof RouteError>[0]) {
	return <RouteError {...props} message='Unable to load service providers at this time. Please try again.' />;
}
