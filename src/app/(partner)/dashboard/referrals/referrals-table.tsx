"use client";

import Link from "next/link";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Users } from "lucide-react";

interface Referral {
  id: string;
  client_first_name: string;
  client_last_name: string;
  client_email: string;
  stage: string;
  created_at: string;
  booked_at: string | null;
  closed_won_at: string | null;
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
