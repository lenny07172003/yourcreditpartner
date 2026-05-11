import { Skeleton } from "@/components/ui/skeleton";

export function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <div className="flex items-start justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <Skeleton className="mt-2 h-7 w-16" />
      <Skeleton className="mt-1.5 h-3 w-20" />
    </div>
  );
}
