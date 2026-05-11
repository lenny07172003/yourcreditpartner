import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";

function StatCard({
  label,
  value,
  sub,
  href,
}: {
  label: string;
  value: string;
  sub?: string;
  href?: string;
}) {
  const card = (
    <div className="rounded-xl border border-line bg-surface p-5 transition-colors hover:border-brand-300">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-ink">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-ink-muted">{sub}</p>}
    </div>
  );

  return href ? <Link href={href}>{card}</Link> : card;
}

export default async function AdminDashboardPage() {
  const admin = createAdminClient();
  const now = new Date();
  const closeMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // Fetch all stats in parallel
  const [
    partnersResult,
    referralsResult,
    commissionsResult,
    payoutsResult,
    monthlyResult,
  ] = await Promise.all([
    admin
      .from("partners")
      .select("id, status", { count: "exact", head: false })
      .is("deleted_at", null),
    admin
      .from("referrals")
      .select("id, stage", { count: "exact", head: false }),
    admin
      .from("commissions")
      .select("amount_cents, state")
      .neq("state", "voided"),
    admin
      .from("payouts")
      .select("total_cents, status")
      .eq("status", "queued"),
    admin
      .from("monthly_partner_stats")
      .select("close_count")
      .eq("close_month", closeMonth),
  ]);

  const partners = partnersResult.data ?? [];
  const activePartners = partners.filter((p) => p.status === "active").length;
  const totalPartners = partners.length;

  const referrals = referralsResult.data ?? [];
  const totalReferrals = referrals.length;
  const closedThisMonth = referrals.filter((r) => r.stage === "closed_won").length;

  const commissions = commissionsResult.data ?? [];
  const totalCommissions = commissions.reduce((s, c) => s + c.amount_cents, 0);
  const pendingCommissions = commissions
    .filter((c) => c.state === "pending")
    .reduce((s, c) => s + c.amount_cents, 0);
  const payableCommissions = commissions
    .filter((c) => c.state === "payable")
    .reduce((s, c) => s + c.amount_cents, 0);
  const paidCommissions = commissions
    .filter((c) => c.state === "paid")
    .reduce((s, c) => s + c.amount_cents, 0);

  const pendingPayouts = payoutsResult.data ?? [];
  const pendingPayoutTotal = pendingPayouts.reduce((s, p) => s + p.total_cents, 0);

  const monthlyCloses = (monthlyResult.data ?? []).reduce((s, m) => s + m.close_count, 0);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Overview of YourCreditPartner operations
        </p>
      </div>

      {/* Top stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Active Partners"
          value={activePartners.toString()}
          sub={`${totalPartners} total`}
          href="/admin/partners"
        />
        <StatCard
          label="Closes MTD"
          value={monthlyCloses.toString()}
          sub={closeMonth}
        />
        <StatCard
          label="Total Referrals"
          value={totalReferrals.toString()}
          href="/admin/referrals"
        />
        <StatCard
          label="Pending Payouts"
          value={`$${(pendingPayoutTotal / 100).toFixed(2)}`}
          sub={`${pendingPayouts.length} queued`}
          href="/admin/payouts"
        />
      </div>

      {/* Commission breakdown */}
      <div className="rounded-xl border border-line bg-surface p-6">
        <h2 className="text-sm font-semibold text-ink">Commission Overview</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-4">
          <div>
            <p className="text-xs font-medium uppercase text-ink-muted">Pending</p>
            <p className="mt-1 text-xl font-bold text-yellow-600">
              ${(pendingCommissions / 100).toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-ink-muted">Payable</p>
            <p className="mt-1 text-xl font-bold text-purple-600">
              ${(payableCommissions / 100).toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-ink-muted">Paid</p>
            <p className="mt-1 text-xl font-bold text-success">
              ${(paidCommissions / 100).toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-ink-muted">All-Time</p>
            <p className="mt-1 text-xl font-bold text-ink">
              ${(totalCommissions / 100).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/admin/partners"
          className="group rounded-xl border border-line bg-surface p-5 transition-colors hover:border-brand-300"
        >
          <p className="text-sm font-semibold text-ink group-hover:text-brand-700">
            Manage Partners
          </p>
          <p className="mt-1 text-xs text-ink-muted">
            View, edit, and manage partner accounts
          </p>
        </Link>
        <Link
          href="/admin/referrals"
          className="group rounded-xl border border-line bg-surface p-5 transition-colors hover:border-brand-300"
        >
          <p className="text-sm font-semibold text-ink group-hover:text-brand-700">
            All Referrals
          </p>
          <p className="mt-1 text-xs text-ink-muted">
            Track referral pipeline across all partners
          </p>
        </Link>
        <Link
          href="/admin/payouts"
          className="group rounded-xl border border-line bg-surface p-5 transition-colors hover:border-brand-300"
        >
          <p className="text-sm font-semibold text-ink group-hover:text-brand-700">
            Process Payouts
          </p>
          <p className="mt-1 text-xs text-ink-muted">
            Create payout runs and mark as sent
          </p>
        </Link>
      </div>
    </div>
  );
}
