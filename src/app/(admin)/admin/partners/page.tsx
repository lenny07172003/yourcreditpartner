import { createAdminClient } from "@/lib/supabase/admin";
import type { Partner } from "@/types/database";
import { PartnersTable } from "./partners-table";

export default async function AdminPartnersPage() {
  const admin = createAdminClient();

  const { data: partnersData } = await admin
    .from("partners")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const partners = (partnersData ?? []) as Partner[];

  // Get referral pipeline counts per partner
  const { data: referralsData } = await admin
    .from("referrals")
    .select("partner_id, stage");

  const referrals = referralsData ?? [];

  const pipelineMap: Record<string, { submitted: number; booked: number; consulted: number; closed: number }> = {};
  for (const r of referrals) {
    if (!pipelineMap[r.partner_id]) {
      pipelineMap[r.partner_id] = { submitted: 0, booked: 0, consulted: 0, closed: 0 };
    }
    if (r.stage === "submitted") pipelineMap[r.partner_id].submitted++;
    else if (r.stage === "booked") pipelineMap[r.partner_id].booked++;
    else if (r.stage === "consulted") pipelineMap[r.partner_id].consulted++;
    else if (["closed_won", "active_service", "net_revenue_realized"].includes(r.stage)) pipelineMap[r.partner_id].closed++;
  }

  // Get commission totals per partner
  const { data: commissionsData } = await admin
    .from("commissions")
    .select("partner_id, amount_cents")
    .neq("state", "voided");

  const commMap: Record<string, number> = {};
  for (const c of (commissionsData ?? [])) {
    commMap[c.partner_id] = (commMap[c.partner_id] ?? 0) + c.amount_cents;
  }

  const tableData = partners.map((p) => ({
    id: p.id,
    first_name: p.first_name,
    last_name: p.last_name,
    email: p.email,
    company_name: p.company_name,
    partner_type: p.partner_type,
    status: p.status,
    created_at: p.created_at,
    pipeline: pipelineMap[p.id] ?? { submitted: 0, booked: 0, consulted: 0, closed: 0 },
    earnings: commMap[p.id] ?? 0,
  }));

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink">Partners</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {partners.length} total partner{partners.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <PartnersTable data={tableData} />
    </div>
  );
}
