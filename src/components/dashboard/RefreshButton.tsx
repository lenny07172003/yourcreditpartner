"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export function RefreshButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [spinning, setSpinning] = useState(false);

  function handleRefresh() {
    setSpinning(true);
    startTransition(() => {
      router.refresh();
    });
    setTimeout(() => setSpinning(false), 600);
  }

  return (
    <button
      type="button"
      onClick={handleRefresh}
      disabled={isPending}
      className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-2.5 text-sm font-medium text-ink-muted transition-colors hover:bg-surface-raised hover:text-ink disabled:opacity-50"
    >
      <RefreshCw className={cn("size-4", (isPending || spinning) && "animate-spin")} />
      Refresh
    </button>
  );
}
