import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
	return (
		<div className="container-custom py-8">
			<Skeleton className="h-8 w-36 mb-8" />

			{/* Split panel: conversations list + message area */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[600px]">
				{/* Left panel - Conversation list */}
				<div className="border rounded-xl overflow-hidden">
					<div className="p-4 border-b">
						<Skeleton className="h-10 w-full rounded-lg" />
					</div>
					<div className="p-2 space-y-1">
						{Array.from({ length: 6 }).map((_, i) => (
							<div key={i} className="flex items-center gap-3 p-3 rounded-lg">
								<Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
								<div className="flex-1 space-y-1">
									<Skeleton className="h-4 w-2/3" />
									<Skeleton className="h-3 w-full" />
								</div>
								<Skeleton className="h-3 w-10" />
							</div>
						))}
					</div>
				</div>

				{/* Right panel - Message thread */}
				<div className="md:col-span-2 border rounded-xl flex flex-col">
					{/* Chat header */}
					<div className="p-4 border-b flex items-center gap-3">
						<Skeleton className="h-10 w-10 rounded-full" />
						<div className="space-y-1">
							<Skeleton className="h-4 w-32" />
							<Skeleton className="h-3 w-16" />
						</div>
					</div>
					{/* Messages area */}
					<div className="flex-1 p-4 space-y-4">
						<div className="flex justify-start"><Skeleton className="h-12 w-2/3 rounded-2xl" /></div>
						<div className="flex justify-end"><Skeleton className="h-10 w-1/2 rounded-2xl" /></div>
						<div className="flex justify-start"><Skeleton className="h-16 w-3/5 rounded-2xl" /></div>
						<div className="flex justify-end"><Skeleton className="h-10 w-2/5 rounded-2xl" /></div>
					</div>
					{/* Input area */}
					<div className="p-4 border-t flex gap-2">
						<Skeleton className="h-10 flex-1 rounded-lg" />
						<Skeleton className="h-10 w-10 rounded-lg" />
					</div>
				</div>
			</div>
		</div>
	);
}
