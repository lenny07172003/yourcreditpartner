import { Skeleton } from "@/components/ui/skeleton";

function InputFieldSkeleton() {
  return (
    <div>
      <Skeleton className="mb-1.5 h-3 w-24" />
      <Skeleton className="h-10 w-full rounded-lg" />
    </div>
  );
}

export default function SubmitLoading() {
  return (
    <div className="mx-auto max-w-lg space-y-6">
      {/* Heading */}
      <div>
        <Skeleton className="h-6 w-40" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>

      {/* Form skeleton */}
      <div className="space-y-4">
        {/* First + Last name row */}
        <div className="grid gap-4 sm:grid-cols-2">
          <InputFieldSkeleton />
          <InputFieldSkeleton />
        </div>

        {/* Email */}
        <InputFieldSkeleton />

        {/* Phone */}
        <InputFieldSkeleton />

        {/* State */}
        <InputFieldSkeleton />

        {/* Situation textarea */}
        <div>
          <Skeleton className="mb-1.5 h-3 w-28" />
          <Skeleton className="h-20 w-full rounded-lg" />
        </div>

        {/* Submit button */}
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
    </div>
  );
}
