import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
return (
<div className="container-custom py-8 max-w-2xl space-y-6">
<Skeleton className="h-8 w-48 mb-1" />
<Skeleton className="h-4 w-80" />
<div className="rounded-2xl border border-gray-100 dark:border-gray-800 p-6 bg-white dark:bg-gray-900 space-y-5">
{Array.from({ length: 4 }).map((_, i) => (
<div key={i} className="space-y-1.5">
<Skeleton className="h-3.5 w-24" />
<Skeleton className="h-11 w-full rounded-xl" />
</div>
))}
<Skeleton className="h-11 w-full rounded-xl mt-4" />
</div>
</div>
);
}
