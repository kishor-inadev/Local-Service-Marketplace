import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
	return (
		<div className="container-custom py-12 space-y-6">
			{/* Header */}
			<Skeleton className="h-8 w-48" />

			{/* Quick Templates card */}
			<div className="border rounded-xl p-6 space-y-4">
				<Skeleton className="h-5 w-36" />
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					{Array.from({ length: 3 }).map((_, i) => (
						<Skeleton key={i} className="h-12 w-full rounded-lg" />
					))}
				</div>
			</div>

			{/* Time Slots card */}
			<div className="border rounded-xl p-6 space-y-4">
				<div className="flex items-center justify-between">
					<Skeleton className="h-5 w-28" />
					<Skeleton className="h-9 w-24 rounded-lg" />
				</div>
				<div className="space-y-4">
					{Array.from({ length: 5 }).map((_, i) => (
						<div key={i} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-md">
							<Skeleton className="h-10 w-full rounded-lg" />
							<Skeleton className="h-10 w-full rounded-lg" />
							<Skeleton className="h-10 w-full rounded-lg" />
							<Skeleton className="h-10 w-full rounded-lg" />
						</div>
					))}
				</div>
			</div>

			{/* Save bar */}
			<div className="flex items-center gap-4">
				<Skeleton className="h-10 w-32 rounded-lg" />
			</div>
		</div>
	);
}
