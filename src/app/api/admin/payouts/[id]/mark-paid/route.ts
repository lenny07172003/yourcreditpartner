import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { createAdminClient } from "@/lib/supabase/admin";
import { fanOutWebhooks } from "@/lib/integrations/dispatch";

interface Props {
  params: Promise<{ id: string }>;
}

export async function POST(_req: Request, { params }: Props) {
  const deny = await requireAdmin();
  if (deny) return deny;

  const { id } = await params;
  const admin = createAdminClient();

  const { data: payout, error } = await admin
    .from("payouts")
    .update({
      status: "sent",
      sent_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("status", "queued")
    .select("id, org_id, partner_id, total_cents")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (payout) {
    await fanOutWebhooks(admin, payout.org_id, "payout.paid", {
      payout_id: payout.id,
      partner_id: payout.partner_id,
      amount_cents: payout.total_cents,
      method: "zelle",
    }).catch((err) => console.error("[admin/payouts/mark-paid] webhook fan-out failed:", err));
  }

  return NextResponse.json({ success: true });
}
