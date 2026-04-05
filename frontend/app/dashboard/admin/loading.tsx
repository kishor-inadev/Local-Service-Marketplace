import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
	return (
		<div className='space-y-8'>
			<div className='flex items-center justify-between'>
				<Skeleton className='h-8 w-48' />
				<Skeleton className='h-10 w-32 rounded-lg' />
			</div>
			<div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4'>
				{Array.from({ length: 5 }).map((_, i) => (
					<div
						key={i}
						className='border rounded-xl p-6 space-y-3'>
						<Skeleton className='h-3 w-1/2' />
						<Skeleton className='h-8 w-1/3' />
						<Skeleton className='h-12 w-12 rounded-2xl' />
					</div>
				))}
			</div>
			<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
				{Array.from({ length: 3 }).map((_, i) => (
					<div
						key={i}
						className='border rounded-xl p-6 space-y-4'>
						<Skeleton className='h-4 w-1/3' />
						<Skeleton className='h-3 w-full rounded-full' />
						<Skeleton className='h-6 w-16' />
					</div>
				))}
			</div>
		</div>
	);
}
