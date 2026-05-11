import { Skeleton } from "@/components/ui/skeleton";

export default function AdminPartnerDetailLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Skeleton className="h-3 w-20" />
          <Skeleton className="mt-2 h-6 w-44" />
          <Skeleton className="mt-1 h-4 w-48" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>

      {/* Tier + Stats row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Tier card skeleton */}
        <div className="rounded-xl border border-line bg-surface p-5">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="mt-2 h-6 w-24" />
          <Skeleton className="mt-1 h-4 w-10" />
          <Skeleton className="mt-1 h-3 w-32" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-line bg-surface p-5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-2 h-7 w-20" />
          </div>
        ))}
      </div>

      {/* Pipeline visualization skeleton */}
      <div className="rounded-xl border border-line bg-surface p-6">
        <Skeleton className="mb-4 h-4 w-32" />
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex-1 text-center">
              <Skeleton className="mx-auto mb-2 h-2 w-full rounded-full" />
              <Skeleton className="mx-auto h-6 w-8" />
              <Skeleton className="mx-auto mt-1 h-2.5 w-14" />
            </div>
          ))}
        </div>
      </div>

      {/* Referrals table skeleton */}
      <div className="rounded-xl border border-line bg-surface">
        <div className="border-b border-line px-6 py-4">
          <Skeleton className="h-4 w-32" />
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-line bg-surface-soft">
              {Array.from({ length: 8 }).map((_, i) => (
                <th key={i} className="px-4 py-3">
                  <Skeleton className="h-3 w-16" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 4 }).map((_, rowIdx) => (
              <tr key={rowIdx} className="border-t border-line">
                {Array.from({ length: 8 }).map((_, colIdx) => (
                  <td key={colIdx} className="px-4 py-3">
                    <Skeleton className="h-4 w-full" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Profile section skeleton */}
      <div className="rounded-xl border border-line bg-surface p-6">
        <Skeleton className="mb-4 h-4 w-28" />
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-1 h-4 w-36" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
