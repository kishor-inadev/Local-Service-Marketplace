import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
	return (
		<div className="container-custom py-8">
			{/* Header */}
			<div className="mb-8">
				<Skeleton className="h-8 w-32 mb-2" />
				<Skeleton className="h-4 w-64" />
			</div>

			{/* Settings layout: sidebar + content */}
			<div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
				{/* Sidebar nav */}
				<div className="lg:col-span-1">
					<div className="border rounded-xl p-4 space-y-2">
						{Array.from({ length: 6 }).map((_, i) => (
							<Skeleton key={i} className="h-10 w-full rounded-lg" />
						))}
					</div>
				</div>

				{/* Main content */}
				<div className="lg:col-span-3 space-y-6">
					{/* Settings sections */}
					{Array.from({ length: 3 }).map((_, i) => (
						<div key={i} className="border rounded-xl p-6 space-y-4">
							<Skeleton className="h-5 w-40" />
							<div className="space-y-3">
								<div className="flex items-center justify-between">
									<div className="space-y-1">
										<Skeleton className="h-4 w-32" />
										<Skeleton className="h-3 w-48" />
									</div>
									<Skeleton className="h-6 w-12 rounded-full" />
								</div>
								<div className="flex items-center justify-between">
									<div className="space-y-1">
										<Skeleton className="h-4 w-36" />
										<Skeleton className="h-3 w-52" />
									</div>
									<Skeleton className="h-6 w-12 rounded-full" />
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
