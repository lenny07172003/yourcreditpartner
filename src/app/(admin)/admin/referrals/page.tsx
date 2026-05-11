import { createAdminClient } from "@/lib/supabase/admin";
import { AdminReferralsTable } from "./referrals-table";

export default async function AdminReferralsPage() {
  const admin = createAdminClient();

  const { data } = await admin
    .from("referrals")
    .select("*, partners!inner(first_name, last_name, partner_slug)")
    .order("created_at", { ascending: false })
    .limit(500);

  const referrals = (data ?? []).map((r: any) => ({
    id: r.id,
    client_first_name: r.client_first_name,
    client_last_name: r.client_last_name,
    client_email: r.client_email,
    partner_id: r.partner_id,
    partner_name: `${r.partners?.first_name ?? ""} ${r.partners?.last_name ?? ""}`.trim(),
    stage: r.stage,
    created_at: r.created_at,
    gross_revenue_cents: r.gross_revenue_cents,
  }));

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-ink">All Referrals</h1>
        <p className="mt-1 text-sm text-ink-muted">
          {referrals.length} referral{referrals.length !== 1 ? "s" : ""}
        </p>
      </div>

      <AdminReferralsTable data={referrals} />
    </div>
  );
}
