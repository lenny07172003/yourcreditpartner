import { Skeleton } from "@/components/ui/skeleton";

export default function ResourcesLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Heading */}
      <div>
        <Skeleton className="h-6 w-28" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>

      {/* Card skeletons */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-line bg-surface p-6">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="mt-2 h-3 w-full max-w-md" />
          <div className="mt-3 flex items-center gap-2">
            <Skeleton className="h-10 flex-1 rounded-lg" />
            <Skeleton className="h-10 w-20 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}
