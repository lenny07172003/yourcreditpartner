"use client";

import Link from "next/link";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { ClipboardList } from "lucide-react";

interface AdminReferral {
  id: string;
  client_first_name: string;
  client_last_name: string;
  client_email: string;
  partner_id: string;
  partner_name: string;
  stage: string;
  created_at: string;
  gross_revenue_cents: number | null;
}

const columns: ColumnDef<AdminReferral>[] = [
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
    accessorKey: "partner_name",
    header: "Partner",
    cell: ({ row }) => (
      <Link
        href={`/admin/partners/${row.original.partner_id}`}
        className="text-sm font-medium text-brand-600 hover:underline"
      >
        {row.original.partner_name}
      </Link>
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
        year: "numeric",
      }),
  },
  {
    accessorKey: "gross_revenue_cents",
    header: "Revenue",
    cell: ({ row }) =>
      row.original.gross_revenue_cents
        ? `$${(row.original.gross_revenue_cents / 100).toFixed(2)}`
        : "—",
  },
];

export function AdminReferralsTable({ data }: { data: AdminReferral[] }) {
  return (
    <DataTable
      columns={columns}
      data={data}
      searchKey="client_first_name"
      searchPlaceholder="Search by client name..."
      pageSize={25}
      emptyIcon={ClipboardList}
      emptyTitle="No referrals yet"
      emptyDescription="Referrals will appear here as partners submit them"
    />
  );
}
