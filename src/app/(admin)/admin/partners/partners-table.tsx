"use client";

import Link from "next/link";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Users } from "lucide-react";

interface PartnerRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  company_name: string | null;
  partner_type: string;
  status: string;
  created_at: string;
  pipeline: { submitted: number; booked: number; consulted: number; closed: number };
  earnings: number;
}

const columns: ColumnDef<PartnerRow>[] = [
  {
    accessorKey: "first_name",
    header: "Partner",
    cell: ({ row }) => (
      <div>
        <p className="text-sm font-medium text-ink">
          {row.original.first_name} {row.original.last_name}
        </p>
        <p className="text-xs text-ink-muted">{row.original.email}</p>
        {row.original.company_name && (
          <p className="text-xs text-ink-muted">{row.original.company_name}</p>
        )}
      </div>
    ),
  },
  {
    accessorKey: "partner_type",
    header: "Type",
    cell: ({ row }) => (
      <span className="text-xs capitalize text-ink-muted">
        {row.original.partner_type.replace(/-/g, " ")}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    id: "pipeline",
    header: "Pipeline",
    enableSorting: false,
    cell: ({ row }) => {
      const pl = row.original.pipeline;
      return (
        <div className="flex gap-3 text-xs font-semibold">
          <span className={pl.submitted > 0 ? "text-blue-600" : "text-ink-muted"}>
            {pl.submitted}S
          </span>
          <span className={pl.booked > 0 ? "text-yellow-600" : "text-ink-muted"}>
            {pl.booked}B
          </span>
          <span className={pl.consulted > 0 ? "text-purple-600" : "text-ink-muted"}>
            {pl.consulted}C
          </span>
          <span className={pl.closed > 0 ? "text-emerald-600" : "text-ink-muted"}>
            {pl.closed}W
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "earnings",
    header: "Earnings",
    cell: ({ row }) => (
      <span className="text-sm font-semibold text-ink">
        {row.original.earnings > 0
          ? `$${(row.original.earnings / 100).toFixed(2)}`
          : "—"}
      </span>
    ),
  },
  {
    accessorKey: "created_at",
    header: "Joined",
    cell: ({ row }) =>
      new Date(row.original.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
  },
  {
    id: "actions",
    enableSorting: false,
    cell: ({ row }) => (
      <Link
        href={`/admin/partners/${row.original.id}`}
        className="text-xs font-medium text-brand-600 hover:underline"
      >
        View →
      </Link>
    ),
  },
];

export function PartnersTable({ data }: { data: PartnerRow[] }) {
  return (
    <DataTable
      columns={columns}
      data={data}
      searchKey="first_name"
      searchPlaceholder="Search by name or email..."
      pageSize={20}
      emptyIcon={Users}
      emptyTitle="No partners yet"
      emptyDescription="Partners will appear here after they apply"
    />
  );
}
