import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
	return (
		<div className="container-custom py-12 space-y-8">
			{/* Header */}
			<Skeleton className="h-8 w-48" />

			{/* 4 Stat cards */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
				{Array.from({ length: 4 }).map((_, i) => (
					<div key={i} className="border rounded-xl p-6 space-y-3">
						<Skeleton className="h-3 w-1/2" />
						<Skeleton className="h-8 w-2/3" />
						<Skeleton className="h-12 w-12 rounded-2xl" />
					</div>
				))}
			</div>

			{/* Date filter card */}
			<div className="border rounded-xl p-6">
				<div className="flex items-center justify-between">
					<Skeleton className="h-10 w-48 rounded-lg" />
					<Skeleton className="h-10 w-28 rounded-lg" />
				</div>
			</div>

			{/* Monthly breakdown grid */}
			<div className="border rounded-xl p-6 space-y-4">
				<Skeleton className="h-5 w-40" />
				<div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
					{Array.from({ length: 6 }).map((_, i) => (
						<div key={i} className="border rounded-lg p-4 space-y-2">
							<Skeleton className="h-3 w-2/3" />
							<Skeleton className="h-6 w-1/2" />
						</div>
					))}
				</div>
			</div>

			{/* Transaction history table */}
			<div className="border rounded-xl p-6 space-y-4">
				<Skeleton className="h-5 w-44" />
				<div className="space-y-3">
					{/* Table header */}
					<div className="flex gap-4 pb-2 border-b">
						<Skeleton className="h-4 w-1/4" />
						<Skeleton className="h-4 w-1/4" />
						<Skeleton className="h-4 w-1/4" />
						<Skeleton className="h-4 w-1/4" />
					</div>
					{/* Table rows */}
					{Array.from({ length: 5 }).map((_, i) => (
						<div key={i} className="flex gap-4 py-2">
							<Skeleton className="h-4 w-1/4" />
							<Skeleton className="h-4 w-1/4" />
							<Skeleton className="h-4 w-1/4" />
							<Skeleton className="h-4 w-1/4" />
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
