import { Send, Calendar, MessageSquare, CheckCircle, Briefcase, DollarSign, AlertTriangle, ChevronRight } from "lucide-react";

const STAGES = [
  { key: "submitted", label: "Submitted", description: "Referral sent, awaiting booking", icon: Send, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", bar: "bg-blue-500" },
  { key: "booked", label: "Booked", description: "Consultation call scheduled", icon: Calendar, color: "text-yellow-600", bg: "bg-yellow-50", border: "border-yellow-200", bar: "bg-yellow-500" },
  { key: "consulted", label: "Consulted", description: "Consultation completed", icon: MessageSquare, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200", bar: "bg-purple-500" },
  { key: "closed", label: "Closed", description: "Client signed up", icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", bar: "bg-emerald-500" },
  { key: "active_service", label: "In Service", description: "Credit repair in progress", icon: Briefcase, color: "text-brand-600", bg: "bg-brand-50", border: "border-brand-200", bar: "bg-brand-500" },
  { key: "paid", label: "Paid", description: "Commission earned", icon: DollarSign, color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-300", bar: "bg-emerald-600" },
] as const;

export function ReferralPipeline({
  submitted,
  booked,
  consulted,
  closed,
  active_service,
  paid,
  refunded,
  total,
}: {
  submitted: number;
  booked: number;
  consulted: number;
  closed: number;
  active_service: number;
  paid: number;
  refunded: number;
  total: number;
}) {
  const counts: Record<string, number> = { submitted, booked, consulted, closed, active_service, paid };

  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
          Client Pipeline
        </p>
        {refunded > 0 && (
          <div className="flex items-center gap-1 text-xs text-red-600">
            <AlertTriangle className="size-3" />
            {refunded} refunded
          </div>
        )}
      </div>

      {/* Pipeline flow bar */}
      {total > 0 && (
        <div className="mb-5 flex h-2.5 overflow-hidden rounded-full bg-surface-raised">
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

      {/* Stage cards with arrows */}
      <div className="flex items-stretch gap-1 overflow-x-auto">
        {STAGES.map((s, i) => {
          const Icon = s.icon;
          const count = counts[s.key];
          return (
            <div key={s.key} className="flex items-center">
              <div
                className={`flex min-w-[100px] flex-1 flex-col items-center rounded-lg border ${s.border} ${s.bg} p-3 text-center transition-all duration-300 hover:shadow-sm`}
              >
                <Icon className={`mb-1 size-5 ${s.color}`} />
                <p className={`text-xl font-bold ${s.color}`}>{count}</p>
                <p className="text-[10px] font-medium uppercase tracking-wide text-ink-muted">
                  {s.label}
                </p>
              </div>
              {i < STAGES.length - 1 && (
                <ChevronRight className="mx-0.5 size-4 shrink-0 text-ink-muted/40" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
