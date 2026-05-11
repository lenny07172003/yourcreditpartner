import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<
  string,
  { label: string; dot: string; bg: string; text: string }
> = {
  // Partner statuses
  active: {
    label: "Active",
    dot: "bg-emerald-500",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
  },
  paused: {
    label: "Paused",
    dot: "bg-amber-500",
    bg: "bg-amber-50",
    text: "text-amber-700",
  },
  terminated: {
    label: "Terminated",
    dot: "bg-red-500",
    bg: "bg-red-50",
    text: "text-red-700",
  },

  // Referral stages
  submitted: {
    label: "Submitted",
    dot: "bg-blue-500",
    bg: "bg-blue-50",
    text: "text-blue-700",
  },
  booked: {
    label: "Booked",
    dot: "bg-yellow-500",
    bg: "bg-yellow-50",
    text: "text-yellow-700",
  },
  consulted: {
    label: "Consulted",
    dot: "bg-purple-500",
    bg: "bg-purple-50",
    text: "text-purple-700",
  },
  closed_won: {
    label: "Closed Won",
    dot: "bg-emerald-500",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
  },
  active_service: {
    label: "Active Service",
    dot: "bg-emerald-500",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
  },
  net_revenue_realized: {
    label: "Revenue Realized",
    dot: "bg-emerald-600",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
  },
  refunded: {
    label: "Refunded",
    dot: "bg-red-500",
    bg: "bg-red-50",
    text: "text-red-700",
  },

  // Appointment statuses
  scheduled: {
    label: "Scheduled",
    dot: "bg-blue-500",
    bg: "bg-blue-50",
    text: "text-blue-700",
  },
  rescheduled: {
    label: "Rescheduled",
    dot: "bg-amber-500",
    bg: "bg-amber-50",
    text: "text-amber-700",
  },
  cancelled: {
    label: "Cancelled",
    dot: "bg-red-500",
    bg: "bg-red-50",
    text: "text-red-700",
  },
  completed: {
    label: "Completed",
    dot: "bg-emerald-500",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
  },
  no_show: {
    label: "No Show",
    dot: "bg-red-500",
    bg: "bg-red-50",
    text: "text-red-700",
  },

  // Commission states
  pending: {
    label: "Pending",
    dot: "bg-yellow-500",
    bg: "bg-yellow-50",
    text: "text-yellow-700",
  },
  earned: {
    label: "Earned",
    dot: "bg-blue-500",
    bg: "bg-blue-50",
    text: "text-blue-700",
  },
  payable: {
    label: "Payable",
    dot: "bg-purple-500",
    bg: "bg-purple-50",
    text: "text-purple-700",
  },
  paid: {
    label: "Paid",
    dot: "bg-emerald-500",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
  },
  voided: {
    label: "Voided",
    dot: "bg-gray-500",
    bg: "bg-gray-50",
    text: "text-gray-700",
  },

  // Payout statuses
  queued: {
    label: "Queued",
    dot: "bg-yellow-500",
    bg: "bg-yellow-50",
    text: "text-yellow-700",
  },
  sent: {
    label: "Sent",
    dot: "bg-emerald-500",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
  },
  confirmed: {
    label: "Confirmed",
    dot: "bg-emerald-600",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
  },
  failed: {
    label: "Failed",
    dot: "bg-red-500",
    bg: "bg-red-50",
    text: "text-red-700",
  },

  // Video/content statuses
  live: {
    label: "Live",
    dot: "bg-emerald-500",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
  },
  draft: {
    label: "Draft",
    dot: "bg-gray-400",
    bg: "bg-gray-50",
    text: "text-gray-600",
  },
  inactive: {
    label: "Inactive",
    dot: "bg-gray-400",
    bg: "bg-gray-50",
    text: "text-gray-600",
  },
};

export function StatusBadge({
  status,
  label,
  className,
}: {
  status: string;
  label?: string;
  className?: string;
}) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    dot: "bg-gray-400",
    bg: "bg-gray-100",
    text: "text-gray-600",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        config.bg,
        config.text,
        className
      )}
    >
      <span className={cn("size-1.5 rounded-full", config.dot)} />
      {label ?? config.label}
    </span>
  );
}
