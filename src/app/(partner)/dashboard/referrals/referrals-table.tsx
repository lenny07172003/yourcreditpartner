"use client";

import Link from "next/link";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Users, Calendar } from "lucide-react";

interface Referral {
  id: string;
  client_first_name: string;
  client_last_name: string;
  client_email: string;
  stage: string;
  created_at: string;
  booked_at: string | null;
  closed_won_at: string | null;
  appointment_at: string | null;
  appointment_end_at: string | null;
  appointment_status: string | null;
}

const columns: ColumnDef<Referral>[] = [
  {
    accessorKey: "client_first_name",
    header: "Client",
    cell: ({ row }) => (
      <div>
        <p className="text-sm font-medium text-ink">
          {row.original.client_first_name} {row.original.client_last_name}
        </p>
        <p className="text-xs text-ink-muted">{row.original.client_email}</p>
      </div>
    ),
  },
  {
    accessorKey: "stage",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.stage} />,
  },
  {
    accessorKey: "appointment_at",
    header: "Appointment",
    cell: ({ row }) => {
      const { appointment_at, appointment_status } = row.original;
      if (!appointment_at) return <span className="text-xs text-ink-muted">—</span>;

      const formatted = new Date(appointment_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });

      if (appointment_status === "cancelled") {
        return (
          <div>
            <p className="text-sm text-red-600 line-through">{formatted}</p>
            <p className="text-xs font-medium text-red-600">Cancelled</p>
          </div>
        );
      }

      if (appointment_status === "rescheduled") {
        return (
          <div>
            <p className="text-sm text-ink">{formatted}</p>
            <p className="text-xs font-medium text-amber-600">Rescheduled</p>
          </div>
        );
      }

      // Scheduled
      return (
        <div className="flex items-center gap-1.5">
          <Calendar className="size-3.5 text-blue-500" />
          <p className="text-sm text-ink">{formatted}</p>
        </div>
      );
    },
  },
  {
    accessorKey: "created_at",
    header: "Submitted",
    cell: ({ row }) =>
      new Date(row.original.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
  },
  {
    accessorKey: "booked_at",
    header: "Booked",
    cell: ({ row }) =>
      row.original.booked_at
        ? new Date(row.original.booked_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })
        : "—",
  },
  {
    accessorKey: "closed_won_at",
    header: "Closed",
    cell: ({ row }) =>
      row.original.closed_won_at
        ? new Date(row.original.closed_won_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })
        : "—",
  },
];

export function ReferralsTable({ data }: { data: Referral[] }) {
  return (
    <DataTable
      columns={columns}
      data={data}
      searchKey="client_first_name"
      searchPlaceholder="Search by client name..."
      emptyIcon={Users}
      emptyTitle="No referrals yet"
      emptyDescription="Submit your first referral to get started"
      emptyAction={
        <Link
          href="/dashboard/submit"
          className="inline-flex rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-500"
        >
          Submit Referral
        </Link>
      }
    />
  );
}
