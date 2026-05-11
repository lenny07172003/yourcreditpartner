"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface MonthData {
  month: string;
  pending: number;
  earned: number;
  payable: number;
  paid: number;
}

interface CashflowChartProps {
  data: MonthData[];
}

const SEGMENTS = [
  { key: "pending", label: "Pending", color: "#EAB308" },
  { key: "earned", label: "Earned", color: "#3B82F6" },
  { key: "payable", label: "Payable", color: "#A855F7" },
  { key: "paid", label: "Paid", color: "#10B981" },
] as const;

export function CashflowChart({ data }: CashflowChartProps) {
  const chartData = data.map((d) => ({
    month: d.month,
    pending: d.pending / 100,
    earned: d.earned / 100,
    payable: d.payable / 100,
    paid: d.paid / 100,
  }));

  return (
    <div className="rounded-xl border border-line bg-surface p-6">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--color-line)"
            vertical={false}
          />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: "var(--color-ink-muted)" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v: number) => `$${v.toLocaleString()}`}
            tick={{ fontSize: 11, fill: "var(--color-ink-muted)" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(value: unknown, name: unknown) => [
              `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              SEGMENTS.find((s) => s.key === name)?.label ?? String(name),
            ]}
            contentStyle={{
              borderRadius: 8,
              border: "1px solid var(--color-line)",
              background: "var(--color-surface)",
              fontSize: 12,
            }}
          />
          <Legend
            verticalAlign="bottom"
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            formatter={(value: string) =>
              SEGMENTS.find((s) => s.key === value)?.label ?? value
            }
          />
          {SEGMENTS.map((seg) => (
            <Bar
              key={seg.key}
              dataKey={seg.key}
              stackId="stack"
              fill={seg.color}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
