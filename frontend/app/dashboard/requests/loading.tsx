import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
	return (
		<div className="container-custom py-12">
			{/* Header */}
			<div className="flex items-center justify-between mb-10">
				<Skeleton className="h-8 w-48" />
				<Skeleton className="h-10 w-36 rounded-lg" />
			</div>

			{/* Filters */}
			<div className="flex flex-wrap gap-3 mb-6">
				<Skeleton className="h-10 w-32 rounded-lg" />
				<Skeleton className="h-10 w-32 rounded-lg" />
				<Skeleton className="h-10 w-32 rounded-lg" />
			</div>

			{/* Request cards */}
			<div className="grid gap-6">
				{Array.from({ length: 5 }).map((_, i) => (
					<div key={i} className="border rounded-lg p-6 space-y-3">
						<div className="flex items-center justify-between">
							<Skeleton className="h-5 w-2/5" />
							<Skeleton className="h-6 w-20 rounded-full" />
						</div>
						<Skeleton className="h-4 w-3/4" />
						<div className="flex gap-4">
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-4 w-24" />
						</div>
					</div>
				))}
			</div>

			{/* Pagination */}
			<div className="flex justify-center mt-8 gap-2">
				{Array.from({ length: 5 }).map((_, i) => (
					<Skeleton key={i} className="h-10 w-10 rounded-lg" />
				))}
			</div>
		</div>
	);
}
