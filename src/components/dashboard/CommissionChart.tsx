"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface CommissionChartProps {
  pending: number;
  earned: number;
  payable: number;
  paid: number;
}

const SEGMENTS = [
  { key: "pending", label: "Pending", color: "#EAB308" },
  { key: "earned", label: "Earned", color: "#3B82F6" },
  { key: "payable", label: "Payable", color: "#A855F7" },
  { key: "paid", label: "Paid", color: "#10B981" },
] as const;

export function CommissionChart({ pending, earned, payable, paid }: CommissionChartProps) {
  if (pending === 0 && earned === 0 && payable === 0 && paid === 0) return null;

  const data = [
    {
      name: "Commissions",
      pending: pending / 100,
      earned: earned / 100,
      payable: payable / 100,
      paid: paid / 100,
    },
  ];

  return (
    <div className="rounded-xl border border-line bg-surface p-6">
      <ResponsiveContainer width="100%" height={80}>
        <BarChart data={data} layout="vertical" barSize={32}>
          <XAxis
            type="number"
            tickFormatter={(v: number) => `$${v.toLocaleString()}`}
            tick={{ fontSize: 11, fill: "var(--color-ink-muted)" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis type="category" dataKey="name" hide />
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
              radius={
                seg.key === "pending"
                  ? [4, 0, 0, 4]
                  : seg.key === "paid"
                    ? [0, 4, 4, 0]
                    : [0, 0, 0, 0]
              }
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
