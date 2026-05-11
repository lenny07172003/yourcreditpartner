import { Send, Calendar, MessageSquare, CheckCircle, AlertTriangle } from "lucide-react";

const STAGES = [
  { key: "submitted", label: "Submitted", icon: Send, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", bar: "bg-blue-500" },
  { key: "booked", label: "Booked", icon: Calendar, color: "text-yellow-600", bg: "bg-yellow-50", border: "border-yellow-200", bar: "bg-yellow-500" },
  { key: "consulted", label: "Consulted", icon: MessageSquare, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200", bar: "bg-purple-500" },
  { key: "closed", label: "Closed", icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", bar: "bg-emerald-500" },
] as const;

export function ReferralPipeline({
  submitted,
  booked,
  consulted,
  closed,
  refunded,
  total,
}: {
  submitted: number;
  booked: number;
  consulted: number;
  closed: number;
  refunded: number;
  total: number;
}) {
  const counts: Record<string, number> = { submitted, booked, consulted, closed };

  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
          Referral Pipeline
        </p>
        {refunded > 0 && (
          <div className="flex items-center gap-1 text-xs text-red-600">
            <AlertTriangle className="size-3" />
            {refunded} refunded
          </div>
        )}
      </div>

      {/* Pipeline bar */}
      {total > 0 && (
        <div className="mb-4 flex h-2 overflow-hidden rounded-full bg-surface-raised">
          {STAGES.map((s) => {
            const count = counts[s.key];
            if (count === 0) return null;
            const width = (count / total) * 100;
            return (
              <div
                key={s.key}
                className={`${s.bar} transition-all duration-500`}
                style={{ width: `${width}%` }}
              />
            );
          })}
        </div>
      )}

      {/* Stage cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {STAGES.map((s) => {
          const Icon = s.icon;
          const count = counts[s.key];
          return (
            <div
              key={s.key}
              className={`rounded-lg border ${s.border} ${s.bg} p-3 text-center transition-all duration-300 hover:shadow-sm`}
            >
              <Icon className={`mx-auto mb-1.5 size-5 ${s.color}`} />
              <p className={`text-xl font-bold ${s.color}`}>{count}</p>
              <p className="text-[10px] font-medium uppercase tracking-wide text-ink-muted">
                {s.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
