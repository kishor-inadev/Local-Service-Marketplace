import { SkeletonStatCard, Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
	return (
		<div className="container-custom py-8 space-y-8">
			{/* Header */}
			<div>
				<Skeleton className="h-8 w-64 mb-2" />
				<Skeleton className="h-4 w-80" />
			</div>

			{/* Stat cards */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
				{Array.from({ length: 4 }).map((_, i) => (
					<SkeletonStatCard key={i} />
				))}
			</div>

			{/* Quick Actions */}
			<div className="rounded-2xl border border-gray-100 dark:border-gray-800 p-6 space-y-4 bg-white dark:bg-gray-900">
				<Skeleton className="h-5 w-36" />
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					{Array.from({ length: 3 }).map((_, i) => (
						<Skeleton key={i} className="h-11 rounded-xl" />
					))}
				</div>
			</div>

			{/* Content cards */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{Array.from({ length: 2 }).map((_, i) => (
					<div key={i} className="rounded-2xl border border-gray-100 dark:border-gray-800 p-6 space-y-4 bg-white dark:bg-gray-900">
						<Skeleton className="h-5 w-40" />
						{Array.from({ length: 3 }).map((_, j) => (
							<div key={j} className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
								<Skeleton className="h-10 w-10 rounded-xl flex-shrink-0" />
								<div className="flex-1 space-y-1.5">
									<Skeleton className="h-3.5 w-3/4" />
									<Skeleton className="h-3 w-1/2" />
								</div>
							</div>
						))}
					</div>
				))}
			</div>
		</div>
	);
}
