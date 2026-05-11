import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPartnerByAuthId, getPartnerCommissions } from "@/lib/supabase/queries";
import { CommissionsTable } from "./commissions-table";
import { CommissionChart } from "@/components/dashboard/CommissionChart";

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
          { label: "Paid", amount: totals.paid, color: "text-emerald-600" },
        ].map((t) => (
          <div key={t.label} className="rounded-xl border border-line bg-surface p-5 transition-all duration-300 hover:shadow-md hover:border-brand-200">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
              {t.label}
            </p>
            <p className={`mt-1 text-2xl font-bold ${t.color}`}>
              ${(t.amount / 100).toFixed(2)}
            </p>
          </div>
        ))}
      </div>

      <CommissionChart
        pending={totals.pending}
        earned={totals.earned}
        payable={totals.payable}
        paid={totals.paid}
      />

      {/* Lifecycle explanation */}
      <div className="rounded-xl border border-line bg-surface-soft p-4">
        <p className="text-xs text-ink-muted">
          <strong className="text-ink">How it works:</strong> Pending (30-day refund window)
          → Earned (refund window passed) → Payable (batched for payout) → Paid (sent to your Zelle)
        </p>
      </div>

      <CommissionsTable data={commissions} />
    </div>
  );
}
