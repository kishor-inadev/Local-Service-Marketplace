import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
	return (
		<div className="container-custom py-8">
			{/* Header with Mark All Read button */}
			<div className="flex items-center justify-between mb-8">
				<Skeleton className="h-8 w-44" />
				<Skeleton className="h-10 w-36 rounded-lg" />
			</div>

			{/* Notification list */}
			<div className="border rounded-xl divide-y">
				{Array.from({ length: 8 }).map((_, i) => (
					<div key={i} className="p-4 flex items-start gap-3">
						<Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
						<div className="flex-1 space-y-2">
							<Skeleton className="h-4 w-3/4" />
							<Skeleton className="h-3 w-1/2" />
							<Skeleton className="h-3 w-24" />
						</div>
						<Skeleton className="h-2 w-2 rounded-full flex-shrink-0" />
					</div>
				))}
			</div>
		</div>
	);
}
