import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPartnerByAuthId, getPartnerCommissions } from "@/lib/supabase/queries";

const STATE_BADGE: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  earned: "bg-blue-100 text-blue-700",
  payable: "bg-purple-100 text-purple-700",
  paid: "bg-success/10 text-success",
  voided: "bg-danger/10 text-danger",
};

export default async function CommissionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const partner = await getPartnerByAuthId(supabase, user.id);
  if (!partner) redirect("/auth/login");

  const commissions = await getPartnerCommissions(supabase, partner.id);

  const totals = {
    pending: commissions.filter((c) => c.state === "pending").reduce((s, c) => s + c.amount_cents, 0),
    earned: commissions.filter((c) => c.state === "earned").reduce((s, c) => s + c.amount_cents, 0),
    payable: commissions.filter((c) => c.state === "payable").reduce((s, c) => s + c.amount_cents, 0),
    paid: commissions.filter((c) => c.state === "paid").reduce((s, c) => s + c.amount_cents, 0),
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-ink">Commissions</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Track your earnings through the commission lifecycle
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Pending", amount: totals.pending, color: "text-yellow-600" },
          { label: "Earned", amount: totals.earned, color: "text-blue-600" },
          { label: "Payable", amount: totals.payable, color: "text-purple-600" },
          { label: "Paid", amount: totals.paid, color: "text-success" },
        ].map((t) => (
          <div key={t.label} className="rounded-xl border border-line bg-surface p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
              {t.label}
            </p>
            <p className={`mt-1 text-2xl font-bold ${t.color}`}>
              ${(t.amount / 100).toFixed(2)}
            </p>
          </div>
        ))}
      </div>

      {/* Lifecycle explanation */}
      <div className="rounded-xl border border-line bg-surface-soft p-4">
        <p className="text-xs text-ink-muted">
          <strong className="text-ink">How it works:</strong> Pending (30-day refund window)
          → Earned (refund window passed) → Payable (batched for payout) → Paid (sent to your Zelle)
        </p>
      </div>

      {/* Commissions table */}
      <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-line bg-surface-soft text-xs font-semibold uppercase tracking-wide text-ink-muted">
              <th className="px-4 py-3">Month</th>
              <th className="px-4 py-3">Net Revenue</th>
              <th className="px-4 py-3">Rate</th>
              <th className="px-4 py-3">Commission</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {commissions.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-ink-muted">
                  No commissions yet. Submit referrals to start earning!
                </td>
              </tr>
            ) : (
              commissions.map((c) => (
                <tr key={c.id} className="border-t border-line hover:bg-surface-soft">
                  <td className="px-4 py-3 text-sm text-ink">{c.close_month}</td>
                  <td className="px-4 py-3 text-sm text-ink-muted">
                    ${(c.net_revenue_cents / 100).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm text-ink-muted">
                    {(c.commission_rate * 100).toFixed(0)}%
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-ink">
                    ${(c.amount_cents / 100).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATE_BADGE[c.state] ?? "bg-surface-raised text-ink-muted"}`}
                    >
                      {c.state}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
