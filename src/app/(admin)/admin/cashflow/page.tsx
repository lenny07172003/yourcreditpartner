import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminCashflowPage() {
  const admin = createAdminClient();

  const { data: commissions } = await admin
    .from("commissions")
    .select("amount_cents, state, close_month")
    .neq("state", "voided")
    .order("close_month", { ascending: false });

  const all = commissions ?? [];

  // Group by month
  const byMonth: Record<string, { pending: number; earned: number; payable: number; paid: number }> = {};
  for (const c of all) {
    if (!byMonth[c.close_month]) {
      byMonth[c.close_month] = { pending: 0, earned: 0, payable: 0, paid: 0 };
    }
    const key = c.state as "pending" | "earned" | "payable" | "paid";
    if (byMonth[c.close_month][key] !== undefined) {
      byMonth[c.close_month][key] += c.amount_cents;
    }
  }

  const months = Object.entries(byMonth).sort((a, b) => b[0].localeCompare(a[0]));
  const totalPaid = all.filter((c) => c.state === "paid").reduce((s, c) => s + c.amount_cents, 0);
  const totalOutstanding = all.filter((c) => c.state !== "paid").reduce((s, c) => s + c.amount_cents, 0);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-ink">Cashflow</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Commission obligations by month
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-line bg-surface p-5">
          <p className="text-xs font-medium uppercase text-ink-muted">Total Paid Out</p>
          <p className="mt-1 text-2xl font-bold text-success">${(totalPaid / 100).toFixed(2)}</p>
        </div>
        <div className="rounded-xl border border-line bg-surface p-5">
          <p className="text-xs font-medium uppercase text-ink-muted">Outstanding</p>
          <p className="mt-1 text-2xl font-bold text-yellow-600">${(totalOutstanding / 100).toFixed(2)}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-line bg-surface-soft text-xs font-semibold uppercase tracking-wide text-ink-muted">
              <th className="px-4 py-3">Month</th>
              <th className="px-4 py-3">Pending</th>
              <th className="px-4 py-3">Earned</th>
              <th className="px-4 py-3">Payable</th>
              <th className="px-4 py-3">Paid</th>
            </tr>
          </thead>
          <tbody>
            {months.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-ink-muted">
                  No commission data yet.
                </td>
              </tr>
            ) : (
              months.map(([month, totals]) => (
                <tr key={month} className="border-t border-line hover:bg-surface-soft">
                  <td className="px-4 py-3 text-sm font-medium text-ink">{month}</td>
                  <td className="px-4 py-3 text-sm text-yellow-600">${(totals.pending / 100).toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm text-blue-600">${(totals.earned / 100).toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm text-purple-600">${(totals.payable / 100).toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm text-success">${(totals.paid / 100).toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
