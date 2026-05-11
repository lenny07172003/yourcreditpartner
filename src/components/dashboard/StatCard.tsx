import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  className,
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-line bg-surface p-5 transition-all duration-300 hover:shadow-md hover:border-brand-200",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
          {label}
        </p>
        {Icon && (
          <div className="rounded-lg bg-brand-50 p-2">
            <Icon className="size-4 text-brand-600" />
          </div>
        )}
      </div>
      <p className="mt-1 text-2xl font-bold text-ink">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-ink-muted">{sub}</p>}
    </div>
  );
}
