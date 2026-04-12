'use client';
import { RouteError } from '@/components/ui/RouteError';
export default function Error(props: Parameters<typeof RouteError>[0]) {
	return <RouteError {...props} title='Admin page error' message='This admin page encountered an error. Please try again.' />;
}
