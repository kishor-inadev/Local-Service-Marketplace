import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
	return (
		<div className="container-custom py-8">
			{/* Header row */}
			<div className="flex items-center justify-between mb-8">
				<Skeleton className="h-8 w-40" />
				<Skeleton className="h-10 w-28 rounded-lg" />
			</div>

			{/* Job cards list */}
			<div className="grid gap-6">
				{Array.from({ length: 4 }).map((_, i) => (
					<div key={i} className="border rounded-lg p-6 space-y-3">
						<div className="flex items-center justify-between">
							<Skeleton className="h-5 w-1/3" />
							<Skeleton className="h-6 w-20 rounded-full" />
						</div>
						<Skeleton className="h-4 w-2/3" />
						<div className="flex items-center gap-4">
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-4 w-20" />
						</div>
						<div className="flex gap-2 pt-2">
							<Skeleton className="h-9 w-24 rounded-lg" />
							<Skeleton className="h-9 w-24 rounded-lg" />
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
