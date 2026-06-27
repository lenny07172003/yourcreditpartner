import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { createAdminClient } from "@/lib/supabase/admin";
import { batchTransition } from "@/lib/commissions/state-machine";
import { OCG_ORG_ID } from "@/lib/org/context";

export async function GET() {
  const deny = await requireAdmin();
  if (deny) return deny;

  const admin = createAdminClient();

  const { data, error } = await admin
    .from("payouts")
    .select("*, partners!inner(first_name, last_name)")
    .eq("org_id", OCG_ORG_ID)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const payouts = (data ?? []).map((p: any) => ({
    id: p.id,
    partner_id: p.partner_id,
    partner_name: `${p.partners.first_name} ${p.partners.last_name}`,
    total_cents: p.total_cents,
    commission_count: p.commission_count,
    zelle_handle: p.zelle_handle,
    status: p.status,
    created_at: p.created_at,
    sent_at: p.sent_at,
  }));

  return NextResponse.json({ payouts });
}

export async function POST(req: NextRequest) {
  const deny = await requireAdmin();
  if (deny) return deny;

  const body = await req.json();
  const admin = createAdminClient();

  if (body.action === "create_run") {
    // Find all payable commissions grouped by partner
    const { data: payable } = await admin
      .from("commissions")
      .select("id, partner_id, amount_cents")
      .eq("org_id", OCG_ORG_ID)
      .eq("state", "payable");

    if (!payable || payable.length === 0) {
      return NextResponse.json({ created: 0, message: "No payable commissions" });
    }

    // Group by partner
    const byPartner: Record<string, { ids: string[]; total: number }> = {};
    for (const c of payable) {
      if (!byPartner[c.partner_id]) {
        byPartner[c.partner_id] = { ids: [], total: 0 };
      }
      byPartner[c.partner_id].ids.push(c.id);
      byPartner[c.partner_id].total += c.amount_cents;
    }

    let created = 0;

    for (const [partnerId, group] of Object.entries(byPartner)) {
      // Get partner's Zelle handle
      const { data: partner } = await admin
        .from("partners")
        .select("zelle_handle")
        .eq("org_id", OCG_ORG_ID)
        .eq("id", partnerId)
        .single();

      // Create payout record
      const { data: payout } = await admin
        .from("payouts")
        .insert({
          org_id: OCG_ORG_ID,
          partner_id: partnerId,
          total_cents: group.total,
          commission_count: group.ids.length,
          zelle_handle: partner?.zelle_handle ?? "",
          status: "queued",
        })
        .select("id")
        .single();

      if (payout) {
        // Transition commissions to paid
        await batchTransition(admin, group.ids, "payable", "paid", {
          payout_id: payout.id,
          org_id: OCG_ORG_ID,
        });
        created++;
      }
    }

    return NextResponse.json({ created });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
