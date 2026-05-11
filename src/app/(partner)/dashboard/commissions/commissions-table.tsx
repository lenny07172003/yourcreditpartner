"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { DollarSign } from "lucide-react";

interface Commission {
  id: string;
  close_month: string;
  net_revenue_cents: number;
  commission_rate: number;
  amount_cents: number;
  state: string;
}

const columns: ColumnDef<Commission>[] = [
  {
    accessorKey: "close_month",
    header: "Month",
    cell: ({ row }) => (
      <span className="text-sm text-ink">{row.original.close_month}</span>
    ),
  },
  {
    accessorKey: "net_revenue_cents",
    header: "Net Revenue",
    cell: ({ row }) => (
      <span className="text-sm text-ink-muted">
        ${(row.original.net_revenue_cents / 100).toFixed(2)}
      </span>
    ),
  },
  {
    accessorKey: "commission_rate",
    header: "Rate",
    cell: ({ row }) => (
      <span className="text-sm text-ink-muted">
        {(row.original.commission_rate * 100).toFixed(0)}%
      </span>
    ),
  },
  {
    accessorKey: "amount_cents",
    header: "Commission",
    cell: ({ row }) => (
      <span className="text-sm font-semibold text-ink">
        ${(row.original.amount_cents / 100).toFixed(2)}
      </span>
    ),
  },
  {
    accessorKey: "state",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.state} />,
  },
];

export function CommissionsTable({ data }: { data: Commission[] }) {
  return (
    <DataTable
      columns={columns}
      data={data}
      emptyIcon={DollarSign}
      emptyTitle="No commissions yet"
      emptyDescription="Submit referrals to start earning commissions"
    />
  );
}
