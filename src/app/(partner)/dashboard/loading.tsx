import { Skeleton } from "@/components/ui/skeleton";
import { StatCardSkeleton } from "@/components/ui/stat-card-skeleton";

export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Welcome header */}
      <div className="flex items-end justify-between">
        <div>
          <Skeleton className="h-7 w-56" />
          <Skeleton className="mt-2 h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-36 rounded-lg" />
      </div>

      {/* Tier card skeleton */}
      <div className="rounded-xl border border-line bg-surface p-5">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-2 h-6 w-24" />
          </div>
          <Skeleton className="h-7 w-12 rounded-full" />
        </div>
        <Skeleton className="mt-4 h-2 w-full rounded-full" />
        <Skeleton className="mt-2 h-3 w-48" />
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* Full-width pipeline card skeleton */}
      <div className="rounded-xl border border-line bg-surface p-5">
        <Skeleton className="h-3 w-28" />
        <div className="mt-3 flex gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex-1 text-center">
              <Skeleton className="mx-auto mb-1.5 h-1.5 w-full rounded-full" />
              <Skeleton className="mx-auto h-6 w-8" />
              <Skeleton className="mx-auto mt-1 h-2.5 w-14" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
