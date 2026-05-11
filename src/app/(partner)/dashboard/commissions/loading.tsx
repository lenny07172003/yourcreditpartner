import { Skeleton } from "@/components/ui/skeleton";
import { TableSkeleton } from "@/components/ui/table-skeleton";

export default function CommissionsLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Heading */}
      <div>
        <Skeleton className="h-6 w-32" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-line bg-surface p-5">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="mt-2 h-7 w-24" />
          </div>
        ))}
      </div>

      {/* Lifecycle explanation skeleton */}
      <div className="rounded-xl border border-line bg-surface-soft p-4">
        <Skeleton className="h-3 w-full max-w-lg" />
      </div>

      {/* Table */}
      <TableSkeleton columns={5} />
    </div>
  );
}
