import { Skeleton } from "@/components/ui/skeleton";
import { TableSkeleton } from "@/components/ui/table-skeleton";

export default function AdminPayoutsLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Heading */}
      <div className="flex items-end justify-between">
        <div>
          <Skeleton className="h-6 w-24" />
          <Skeleton className="mt-2 h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-40 rounded-lg" />
      </div>

      {/* Table */}
      <TableSkeleton columns={6} />
    </div>
  );
}
