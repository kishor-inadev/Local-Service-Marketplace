import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
	return (
		<div className="container-custom py-8">
			{/* Header with sort */}
			<div className="flex items-center justify-between mb-8">
				<div>
					<Skeleton className="h-8 w-48 mb-2" />
					<Skeleton className="h-4 w-64" />
				</div>
				<Skeleton className="h-9 w-36 rounded-md" />
			</div>

			{/* Payment cards */}
			<div className="space-y-4">
				{Array.from({ length: 5 }).map((_, i) => (
					<div key={i} className="border rounded-lg p-6">
						<div className="flex items-center justify-between">
							<div className="flex items-start gap-4 flex-1">
								<Skeleton className="h-12 w-12 rounded-lg flex-shrink-0" />
								<div className="flex-1 space-y-2">
									<div className="flex items-center gap-3">
										<Skeleton className="h-5 w-24" />
										<Skeleton className="h-5 w-16 rounded-full" />
									</div>
									<Skeleton className="h-3 w-40" />
									<Skeleton className="h-3 w-32" />
								</div>
							</div>
						</div>
					</div>
				))}
			</div>

			{/* Pagination */}
			<div className="flex justify-center mt-8 gap-2">
				{Array.from({ length: 4 }).map((_, i) => (
					<Skeleton key={i} className="h-10 w-10 rounded-lg" />
				))}
			</div>
		</div>
	);
}
