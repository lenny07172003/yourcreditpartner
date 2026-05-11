import { NextRequest, NextResponse } from "next/server";
import { verifyGhlSignature } from "@/lib/ghl/verifySignature";
import { createAdminClient } from "@/lib/supabase/admin";
import { getReferralByGhlContactId, logPartnerEvent } from "@/lib/supabase/queries";

/**
 * GHL Webhook: consultation completed
 *
 * Updates referral stage to 'consulted', sets consulted_at timestamp,
 * and advances nurture stage to 'consulted_to_closed'.
 */
export async function POST(req: NextRequest) {
  const { deny, body } = await verifyGhlSignature(req);
  if (deny) return deny;

  const contactId = (body as Record<string, unknown>).contactId as string
    ?? (body as Record<string, unknown>).contact_id as string;

  if (!contactId) {
    console.warn("[ghl/consulted] No contactId in payload");
    return NextResponse.json({ error: "Missing contactId" }, { status: 400 });
  }

  const admin = createAdminClient();

  const referral = await getReferralByGhlContactId(admin, contactId);
  if (!referral) {
    console.warn(`[ghl/consulted] No referral found for contact ${contactId}`);
    return NextResponse.json({ received: true, matched: false });
  }

  const now = new Date().toISOString();

  await admin
    .from("referrals")
    .update({
      stage: "consulted",
      consulted_at: now,
      nurture_stage: "consulted_to_closed",
    })
    .eq("id", referral.id);

  await logPartnerEvent(admin, {
    partner_id: referral.partner_id,
    actor: "system",
    event_type: "referral_consulted",
    payload: {
      referral_id: referral.id,
      ghl_contact_id: contactId,
      client_name: `${referral.client_first_name} ${referral.client_last_name}`,
    },
  });

  console.log(`[ghl/consulted] Referral ${referral.id} marked as consulted`);
  return NextResponse.json({ received: true, matched: true, referralId: referral.id });
}
