import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadTiers, getTierForCloses, getCloseCountForMonth } from "@/lib/commissions/tier-engine";
import { Users, TrendingUp, DollarSign, Clock, UserPlus, LinkIcon } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import type { CommissionTier } from "@/types/database";

function TierCard({
  tierName,
  rate,
  closes,
  nextTierName,
  closesToNext,
}: {
  tierName: string;
  rate: string;
  closes: number;
  nextTierName: string | null;
  closesToNext: number | null;
}) {
  const progress =
    closesToNext !== null && closesToNext > 0
      ? Math.min(100, ((closes / (closes + closesToNext)) * 100))
      : 100;

  return (
    <div className="rounded-xl border border-brand-200 bg-gradient-to-br from-brand-50 to-accent-50 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-brand-600">
            Current Tier
          </p>
          <p className="mt-1 text-xl font-bold text-brand-900">{tierName}</p>
        </div>
        <div className="rounded-full bg-brand-600 px-3 py-1 text-sm font-bold text-white">
          {rate}
        </div>
      </div>

      <div className="mt-4">
        <div className="h-2 rounded-full bg-brand-200">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-brand-500 to-accent-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-brand-700">
          {closesToNext !== null && closesToNext > 0
            ? `${closes} closes this month — ${closesToNext} more to reach ${nextTierName}`
            : "You're at the highest tier!"}
        </p>
      </div>
    </div>
  );
}

function PipelineCard({
  submitted,
  booked,
  consulted,
  closed,
}: {
  submitted: number;
  booked: number;
  consulted: number;
  closed: number;
}) {
  const stages = [
    { label: "Submitted", count: submitted, color: "bg-blue-500" },
    { label: "Booked", count: booked, color: "bg-yellow-500" },
    { label: "Consulted", count: consulted, color: "bg-purple-500" },
    { label: "Closed", count: closed, color: "bg-success" },
  ];

  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
        Referral Pipeline
      </p>
      <div className="mt-3 flex gap-4">
        {stages.map((s) => (
          <div key={s.label} className="flex-1 text-center">
            <div className={`mx-auto mb-1.5 h-1.5 w-full rounded-full ${s.color} opacity-30`}>
              <div
                className={`h-1.5 rounded-full ${s.color}`}
                style={{ width: s.count > 0 ? "100%" : "0%" }}
              />
            </div>
            <p className="text-lg font-bold text-ink">{s.count}</p>
            <p className="text-[10px] font-medium uppercase text-ink-muted">
              {s.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const admin = createAdminClient();

  const { data: partner } = await admin
    .from("partners")
    .select("*")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!partner) redirect("/auth/login");
  const now = new Date();
  const closeMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // Load data — safe defaults if queries fail
  let tiers: CommissionTier[] = [];
  let closeCount = 0;

  try {
    tiers = await loadTiers(admin);
  } catch (e) {
    console.error("[dashboard] loadTiers error:", e);
  }

  try {
    closeCount = await getCloseCountForMonth(admin, partner.id, closeMonth);
  } catch (e) {
    console.error("[dashboard] getCloseCount error:", e);
  }

  const [referralsData, commissionsData] = await Promise.all([
    admin
      .from("referrals")
      .select("stage")
      .eq("partner_id", partner.id),
    admin
      .from("commissions")
      .select("amount_cents, state")
      .eq("partner_id", partner.id)
      .neq("state", "voided"),
  ]);

  const tierInfo = tiers.length > 0
    ? getTierForCloses(tiers, closeCount)
    : { tier: 1 as const, rate: 0.15, displayName: "Starter", minCloses: 1, maxCloses: 9 };
  const nextTier = tiers.find((t) => t.tier_number === tierInfo.tier + 1);

  // Pipeline counts
  const referrals = referralsData.data ?? [];
  const pipeline = {
    submitted: referrals.filter((r) => r.stage === "submitted").length,
    booked: referrals.filter((r) => r.stage === "booked").length,
    consulted: referrals.filter((r) => r.stage === "consulted").length,
    closed: referrals.filter((r) =>
      ["closed_won", "active_service", "net_revenue_realized"].includes(r.stage)
    ).length,
  };

  // Earnings
  const commissions = commissionsData.data ?? [];
  const totalEarnings = commissions.reduce((sum, c) => sum + c.amount_cents, 0);
  const pendingEarnings = commissions
    .filter((c) => c.state === "pending")
    .reduce((sum, c) => sum + c.amount_cents, 0);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Welcome header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">
            Welcome back, {partner.first_name}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Here&rsquo;s how your referrals are performing
          </p>
        </div>
        <Link
          href="/dashboard/submit"
          className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-500"
        >
          + Submit Referral
        </Link>
      </div>

      {/* Tier card */}
      <TierCard
        tierName={tierInfo.displayName}
        rate={`${(tierInfo.rate * 100).toFixed(0)}%`}
        closes={closeCount}
        nextTierName={nextTier?.display_name ?? null}
        closesToNext={nextTier ? nextTier.min_closes - closeCount : null}
      />

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Referrals"
          value={referrals.length.toString()}
          sub="all time"
          icon={Users}
        />
        <StatCard
          label="Closes This Month"
          value={closeCount.toString()}
          sub={closeMonth}
          icon={TrendingUp}
        />
        <StatCard
          label="Total Earned"
          value={`$${(totalEarnings / 100).toFixed(2)}`}
          sub="all time"
          icon={DollarSign}
        />
        <StatCard
          label="Pending"
          value={`$${(pendingEarnings / 100).toFixed(2)}`}
          sub="awaiting 30-day window"
          icon={Clock}
        />
      </div>

      {/* Pipeline */}
      <PipelineCard {...pipeline} />

      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/dashboard/submit"
          className="group rounded-xl border border-line bg-surface p-5 transition-all duration-300 hover:border-brand-300 hover:bg-brand-50 hover:shadow-md"
        >
          <div className="mb-2 inline-flex rounded-lg bg-brand-50 p-2 group-hover:bg-brand-100">
            <UserPlus className="size-5 text-brand-600" />
          </div>
          <p className="text-sm font-semibold text-ink group-hover:text-brand-700">
            Submit a Referral
          </p>
          <p className="mt-1 text-xs text-ink-muted">
            Enter your client&rsquo;s info — we handle the rest
          </p>
        </Link>

        <Link
          href="/dashboard/resources"
          className="group rounded-xl border border-line bg-surface p-5 transition-all duration-300 hover:border-brand-300 hover:bg-brand-50 hover:shadow-md"
        >
          <div className="mb-2 inline-flex rounded-lg bg-brand-50 p-2 group-hover:bg-brand-100">
            <LinkIcon className="size-5 text-brand-600" />
          </div>
          <p className="text-sm font-semibold text-ink group-hover:text-brand-700">
            Your Referral Link
          </p>
          <p className="mt-1 text-xs text-ink-muted">
            Share your unique link — clients fill in their own info
          </p>
        </Link>
      </div>
    </div>
  );
}
