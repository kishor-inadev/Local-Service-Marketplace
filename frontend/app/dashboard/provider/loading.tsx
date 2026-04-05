import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
	return (
		<div className="container-custom py-8 space-y-8">
			{/* Header */}
			<Skeleton className="h-8 w-52" />

			{/* Tab navigation */}
			<div className="border-b border-gray-200 mb-8">
				<nav className="-mb-px flex space-x-8 overflow-x-auto">
					{Array.from({ length: 7 }).map((_, i) => (
						<Skeleton key={i} className="h-10 w-20" />
					))}
				</nav>
			</div>

			{/* Quick Stats - 3 col */}
			<div>
				<Skeleton className="h-5 w-28 mb-4" />
				<div className="grid md:grid-cols-3 gap-6">
					{Array.from({ length: 3 }).map((_, i) => (
						<div key={i} className="border rounded-xl p-6 space-y-3">
							<Skeleton className="h-3 w-1/2" />
							<Skeleton className="h-8 w-1/3" />
							<Skeleton className="h-12 w-12 rounded-2xl" />
						</div>
					))}
				</div>
			</div>

			{/* Quick Actions - 2 col */}
			<div>
				<Skeleton className="h-5 w-28 mb-4" />
				<div className="grid md:grid-cols-2 gap-4">
					{Array.from({ length: 2 }).map((_, i) => (
						<div key={i} className="border rounded-xl p-6 space-y-3">
							<div className="flex items-center gap-3">
								<Skeleton className="h-10 w-10 rounded-lg" />
								<div className="space-y-1">
									<Skeleton className="h-4 w-32" />
									<Skeleton className="h-3 w-48" />
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
