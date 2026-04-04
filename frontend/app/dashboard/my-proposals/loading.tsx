import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
	return (
		<div className="container-custom py-12 space-y-8">
			{/* Header */}
			<Skeleton className="h-8 w-48" />

			{/* 4 Stat cards */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<div key={i} className="border rounded-xl p-6 space-y-3">
						<Skeleton className="h-3 w-1/2" />
						<Skeleton className="h-8 w-1/3" />
						<Skeleton className="h-12 w-12 rounded-2xl" />
					</div>
				))}
			</div>

			{/* Filter dropdown */}
			<div className="border rounded-xl p-4">
				<div className="flex items-center gap-4">
					<Skeleton className="h-4 w-20" />
					<Skeleton className="h-10 w-40 rounded-lg" />
				</div>
			</div>

			{/* Proposal cards */}
			<div className="space-y-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<div key={i} className="border rounded-lg p-6 space-y-3">
						<div className="flex items-center justify-between">
							<Skeleton className="h-5 w-2/5" />
							<Skeleton className="h-6 w-20 rounded-full" />
						</div>
						<Skeleton className="h-4 w-3/4" />
						<div className="flex gap-4">
							<Skeleton className="h-4 w-20" />
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-4 w-20" />
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
