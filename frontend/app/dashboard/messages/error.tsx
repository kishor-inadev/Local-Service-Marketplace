'use client';
import { RouteError } from '@/components/ui/RouteError';
export default function Error(props: Parameters<typeof RouteError>[0]) {
	return <RouteError {...props} title='Messages unavailable' message='Unable to load your messages. Please try again.' />;
}
