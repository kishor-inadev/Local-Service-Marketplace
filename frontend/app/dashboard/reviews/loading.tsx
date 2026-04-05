import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
	return (
		<div className="container-custom py-8 space-y-6">
			{/* Header */}
			<Skeleton className="h-8 w-40" />
			<Skeleton className="h-4 w-64" />

			{/* Review form card */}
			<div className="border rounded-xl p-6 space-y-6">
				{/* Rating */}
				<div className="space-y-2">
					<Skeleton className="h-4 w-16" />
					<div className="flex gap-2">
						{Array.from({ length: 5 }).map((_, i) => (
							<Skeleton key={i} className="h-8 w-8 rounded" />
						))}
					</div>
				</div>
				{/* Text area */}
				<div className="space-y-2">
					<Skeleton className="h-4 w-24" />
					<Skeleton className="h-32 w-full rounded-lg" />
				</div>
				{/* Submit button */}
				<Skeleton className="h-10 w-32 rounded-lg" />
			</div>
		</div>
	);
}
