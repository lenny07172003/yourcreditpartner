import { Skeleton } from "@/components/ui/skeleton";

function InputFieldSkeleton() {
  return (
    <div>
      <Skeleton className="mb-1.5 h-3 w-20" />
      <Skeleton className="h-10 w-full rounded-lg" />
    </div>
  );
}

export default function SettingsLoading() {
  return (
    <div className="mx-auto max-w-lg space-y-8">
      {/* Heading */}
      <div>
        <Skeleton className="h-6 w-24" />
        <Skeleton className="mt-2 h-4 w-56" />
      </div>

      {/* Profile form skeleton */}
      <div className="space-y-4 rounded-xl border border-line bg-surface p-6">
        <Skeleton className="h-4 w-16" />

        {/* First + Last name row */}
        <div className="grid gap-4 sm:grid-cols-2">
          <InputFieldSkeleton />
          <InputFieldSkeleton />
        </div>

        {/* Email */}
        <InputFieldSkeleton />

        {/* Phone */}
        <InputFieldSkeleton />

        {/* Company */}
        <InputFieldSkeleton />

        {/* Zelle */}
        <InputFieldSkeleton />

        {/* Save button */}
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
    </div>
  );
}
