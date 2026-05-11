import { Skeleton } from "@/components/ui/skeleton";
import { StatCardSkeleton } from "@/components/ui/stat-card-skeleton";

export default function AdminDashboardLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Heading */}
      <div>
        <Skeleton className="h-7 w-44" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* Commission overview card */}
      <div className="rounded-xl border border-line bg-surface p-6">
        <Skeleton className="h-4 w-40" />
        <div className="mt-4 grid gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="h-3 w-16" />
              <Skeleton className="mt-2 h-6 w-24" />
            </div>
          ))}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-line bg-surface p-5">
            <Skeleton className="mb-2 h-9 w-9 rounded-lg" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-1.5 h-3 w-full max-w-[200px]" />
          </div>
        ))}
      </div>
    </div>
  );
}
