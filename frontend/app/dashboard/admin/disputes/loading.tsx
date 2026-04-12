import { SkeletonTable, Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
return (
<div className="container-custom py-8 space-y-6">
<div className="flex items-center justify-between">
<Skeleton className="h-8 w-48" />
<Skeleton className="h-10 w-32 rounded-xl" />
</div>
<div className="rounded-2xl border border-gray-100 dark:border-gray-800 p-6 bg-white dark:bg-gray-900">
<SkeletonTable rows={6} />
</div>
</div>
);
}
