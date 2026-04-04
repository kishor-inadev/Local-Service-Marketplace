import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
	return (
		<div className="max-w-6xl mx-auto container-custom py-8">
			{/* Header with count */}
			<div className="mb-8">
				<div className="flex items-center gap-3">
					<Skeleton className="h-8 w-8 rounded-lg" />
					<Skeleton className="h-8 w-48" />
					<Skeleton className="h-6 w-8 rounded-full" />
				</div>
			</div>

			{/* Provider cards grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{Array.from({ length: 6 }).map((_, i) => (
					<div key={i} className="border rounded-lg overflow-hidden">
						<Skeleton className="h-32 w-full" />
						<div className="p-4 space-y-3">
							<div className="flex items-center gap-3">
								<Skeleton className="h-10 w-10 rounded-full" />
								<div className="space-y-1 flex-1">
									<Skeleton className="h-4 w-2/3" />
									<Skeleton className="h-3 w-1/2" />
								</div>
							</div>
							<div className="flex gap-2">
								<Skeleton className="h-6 w-16 rounded-full" />
								<Skeleton className="h-6 w-16 rounded-full" />
							</div>
							<div className="flex gap-2 pt-2">
								<Skeleton className="h-9 w-full rounded-lg" />
								<Skeleton className="h-9 w-9 rounded-lg flex-shrink-0" />
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
