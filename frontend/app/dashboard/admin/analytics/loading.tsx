import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
return (
<div className="container-custom py-8 space-y-6">
<Skeleton className="h-8 w-56 mb-1" />
<Skeleton className="h-4 w-72" />
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
<div className="lg:col-span-2 space-y-5">
<div className="rounded-2xl border border-gray-100 dark:border-gray-800 p-6 bg-white dark:bg-gray-900 space-y-4">
<Skeleton className="h-5 w-40" />
<Skeleton className="h-4 w-full" />
<Skeleton className="h-4 w-5/6" />
<Skeleton className="h-4 w-4/6" />
</div>
<div className="rounded-2xl border border-gray-100 dark:border-gray-800 p-6 bg-white dark:bg-gray-900 space-y-3">
<Skeleton className="h-5 w-32" />
{Array.from({ length: 3 }).map((_, i) => (
<div key={i} className="flex gap-3">
<Skeleton className="h-10 w-10 rounded-xl flex-shrink-0" />
<div className="flex-1 space-y-1.5">
<Skeleton className="h-3.5 w-3/4" />
<Skeleton className="h-3 w-1/2" />
</div>
</div>
))}
</div>
</div>
<div className="space-y-5">
<div className="rounded-2xl border border-gray-100 dark:border-gray-800 p-6 bg-white dark:bg-gray-900 space-y-3">
<Skeleton className="h-5 w-24" />
{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-3.5 w-full" />)}
</div>
</div>
</div>
</div>
);
}
