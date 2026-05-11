'use client';

import { AlertTriangle } from "lucide-react";

export default function DashboardError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="w-full max-w-sm rounded-xl border border-line bg-surface p-8 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-danger/10">
            <AlertTriangle className="size-6 text-danger" />
          </div>
          <h2 className="text-lg font-bold text-ink">Something went wrong</h2>
          <p className="mt-2 text-sm text-ink-muted">
            {error.message || "An unexpected error occurred."}
          </p>
          {error.digest && (
            <p className="mt-1 text-xs text-ink-muted/60">
              Error ID: {error.digest}
            </p>
          )}
          <button
            onClick={unstable_retry}
            className="mt-6 w-full rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-500"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}
