import { Skeleton } from "@/components/ui/skeleton";
import { TableSkeleton } from "@/components/ui/table-skeleton";

export default function ReferralsLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Heading */}
      <div className="flex items-end justify-between">
        <div>
          <Skeleton className="h-6 w-36" />
          <Skeleton className="mt-2 h-4 w-44" />
        </div>
        <Skeleton className="h-10 w-36 rounded-lg" />
      </div>

      {/* Table */}
      <TableSkeleton columns={5} />
    </div>
  );
}
