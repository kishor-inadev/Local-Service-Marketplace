import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
	return (
		<div className="container-custom py-12 space-y-6">
			{/* Header */}
			<Skeleton className="h-8 w-56" />

			{/* Filter card - 3 col */}
			<div className="border rounded-xl p-6">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<Skeleton className="h-10 w-full rounded-lg" />
					<Skeleton className="h-10 w-full rounded-lg" />
					<Skeleton className="h-10 w-full rounded-lg" />
				</div>
			</div>

			{/* Request cards list */}
			<div className="space-y-4">
				{Array.from({ length: 5 }).map((_, i) => (
					<div key={i} className="border rounded-lg p-6 space-y-3">
						<div className="flex items-center justify-between">
							<Skeleton className="h-5 w-1/3" />
							<Skeleton className="h-6 w-20 rounded-full" />
						</div>
						<Skeleton className="h-4 w-3/4" />
						<div className="flex gap-4">
							<Skeleton className="h-4 w-20" />
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-4 w-16" />
						</div>
						<Skeleton className="h-9 w-32 rounded-lg" />
					</div>
				))}
			</div>
		</div>
	);
}
