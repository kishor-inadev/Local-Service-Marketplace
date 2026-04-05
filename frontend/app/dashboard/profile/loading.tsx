import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
	return (
		<div className="bg-white dark:bg-gray-900 min-h-screen">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Cover + Avatar header */}
				<div className="rounded-lg shadow-sm overflow-hidden">
					<Skeleton className="h-32 w-full rounded-none" />
					<div className="px-6 pb-6">
						<div className="flex items-end gap-4 -mt-16">
							<Skeleton className="h-32 w-32 rounded-full border-4 border-white dark:border-gray-900 flex-shrink-0" />
							<div className="pb-2 space-y-2 flex-1">
								<Skeleton className="h-6 w-48" />
								<Skeleton className="h-4 w-32" />
							</div>
							<Skeleton className="h-10 w-28 rounded-lg" />
						</div>
					</div>
				</div>

				{/* 3-col content: sidebar + main */}
				<div className="mt-8 grid md:grid-cols-3 gap-8">
					{/* Sidebar */}
					<div className="space-y-6">
						{/* Contact Info card */}
						<div className="border rounded-xl p-6 space-y-4">
							<Skeleton className="h-5 w-28" />
							{Array.from({ length: 3 }).map((_, i) => (
								<div key={i} className="flex items-center gap-3">
									<Skeleton className="h-5 w-5 rounded" />
									<Skeleton className="h-4 w-3/4" />
								</div>
							))}
						</div>
						{/* Stats card */}
						<div className="border rounded-xl p-6 space-y-4">
							<Skeleton className="h-5 w-24" />
							{Array.from({ length: 4 }).map((_, i) => (
								<div key={i} className="flex justify-between">
									<Skeleton className="h-4 w-1/3" />
									<Skeleton className="h-4 w-12" />
								</div>
							))}
						</div>
					</div>

					{/* Main content */}
					<div className="md:col-span-2 space-y-6">
						{/* About section */}
						<div className="border rounded-xl p-6 space-y-3">
							<Skeleton className="h-5 w-20" />
							<Skeleton className="h-4 w-full" />
							<Skeleton className="h-4 w-4/5" />
							<Skeleton className="h-4 w-2/3" />
						</div>
						{/* Services section */}
						<div className="border rounded-xl p-6 space-y-3">
							<Skeleton className="h-5 w-24" />
							<div className="flex flex-wrap gap-2">
								{Array.from({ length: 5 }).map((_, i) => (
									<Skeleton key={i} className="h-8 w-24 rounded-full" />
								))}
							</div>
						</div>
						{/* Reviews section */}
						<div className="border rounded-xl p-6 space-y-4">
							<Skeleton className="h-5 w-24" />
							{Array.from({ length: 3 }).map((_, i) => (
								<div key={i} className="flex items-start gap-3 p-3 border rounded-lg">
									<Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
									<div className="flex-1 space-y-2">
										<Skeleton className="h-4 w-1/3" />
										<Skeleton className="h-3 w-full" />
										<Skeleton className="h-3 w-2/3" />
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
