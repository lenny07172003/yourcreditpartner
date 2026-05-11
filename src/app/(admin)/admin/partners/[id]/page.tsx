import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Partner } from "@/types/database";
import { loadTiers, getTierForCloses, getCloseCountForMonth } from "@/lib/commissions/tier-engine";
import { StatusBadge } from "@/components/ui/status-badge";
import { PartnerDetailTabs } from "./PartnerDetailTabs";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminPartnerDetailPage({ params }: Props) {
  const { id } = await params;
  const admin = createAdminClient();

  const { data: partner } = await admin
    .from("partners")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!partner) notFound();

  const p = partner as Partner;

  const now = new Date();
  const closeMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // Load everything in parallel
  const [referralsResult, commissionsResult, tiersData, closeCount, referredByResult] = await Promise.all([
    admin
      .from("referrals")
      .select("*")
      .eq("partner_id", id)
      .order("created_at", { ascending: false }),
    admin
      .from("commissions")
      .select("*")
      .eq("partner_id", id)
      .neq("state", "voided")
      .order("created_at", { ascending: false }),
    loadTiers(admin).catch(() => []),
    getCloseCountForMonth(admin, id, closeMonth).catch(() => 0),
    admin
      .from("partners")
      .select("first_name, last_name, partner_slug")
      .eq("id", p.referred_by_partner_id ?? "___none___")
      .maybeSingle(),
  ]);

  const referrals = referralsResult.data ?? [];
  const commissions = commissionsResult.data ?? [];

  const tierInfo = tiersData.length > 0
    ? getTierForCloses(tiersData, closeCount)
    : { tier: 1 as const, rate: 0.15, displayName: "Starter", minCloses: 1, maxCloses: 9 };
  const nextTier = tiersData.find((t) => t.tier_number === tierInfo.tier + 1) ?? null;

  // Pipeline counts
  const pipeline = {
    submitted: referrals.filter((r) => r.stage === "submitted").length,
    booked: referrals.filter((r) => r.stage === "booked").length,
    consulted: referrals.filter((r) => r.stage === "consulted").length,
    closed: referrals.filter((r) => ["closed_won", "active_service", "net_revenue_realized"].includes(r.stage)).length,
    refunded: referrals.filter((r) => r.stage === "refunded").length,
  };

  const totalEarned = commissions.reduce((s, c) => s + c.amount_cents, 0);
  const totalPaid = commissions.filter((c) => c.state === "paid").reduce((s, c) => s + c.amount_cents, 0);

  const referredByName = referredByResult.data
    ? `${referredByResult.data.first_name} ${referredByResult.data.last_name}`
    : null;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header — always visible above tabs */}
      <div className="flex items-start justify-between">
        <div>
          <Link href="/admin/partners" className="text-xs text-brand-600 hover:underline">
            ← All Partners
          </Link>
          <h1 className="mt-2 text-xl font-bold text-ink">
            {p.first_name} {p.last_name}
          </h1>
          <p className="text-sm text-ink-muted">{p.email}</p>
        </div>
        <StatusBadge status={p.status} />
      </div>

      {/* Tabbed content */}
      <PartnerDetailTabs
        partner={{
          first_name: p.first_name,
          last_name: p.last_name,
          email: p.email,
          status: p.status,
          partner_type: p.partner_type,
          company_name: p.company_name,
          phone: p.phone,
          state_of_operation: p.state_of_operation,
          expected_volume: p.expected_volume,
          partner_slug: p.partner_slug,
          created_at: p.created_at,
          last_submission_at: p.last_submission_at,
          notes_internal: p.notes_internal,
          commission_rate_override: p.commission_rate_override,
          w9_url: p.w9_url,
          zelle_handle: p.zelle_handle,
          agreement_signed_at: p.agreement_signed_at,
          agreement_signature_name: p.agreement_signature_name,
          agreement_version: p.agreement_version,
          agreement_ip: p.agreement_ip,
        }}
        referrals={referrals}
        commissions={commissions}
        tierInfo={tierInfo}
        nextTier={nextTier ? { display_name: nextTier.display_name, min_closes: nextTier.min_closes } : null}
        closeCount={closeCount}
        pipeline={pipeline}
        totalEarned={totalEarned}
        totalPaid={totalPaid}
        referredByName={referredByName}
      />
    </div>
  );
}
