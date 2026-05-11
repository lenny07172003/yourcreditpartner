import { Skeleton } from "@/components/ui/skeleton";
import { TableSkeleton } from "@/components/ui/table-skeleton";

export default function AdminPartnersLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Heading */}
      <div>
        <Skeleton className="h-6 w-24" />
        <Skeleton className="mt-2 h-4 w-36" />
      </div>

      {/* Table */}
      <TableSkeleton columns={8} />
    </div>
  );
}
