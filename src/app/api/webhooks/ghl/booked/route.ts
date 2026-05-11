import { NextRequest, NextResponse } from "next/server";
import { verifyGhlSignature } from "@/lib/ghl/verifySignature";
import { createAdminClient } from "@/lib/supabase/admin";
import { getReferralByGhlContactId, logPartnerEvent } from "@/lib/supabase/queries";

/**
 * GHL Webhook: appointment confirmed (booked)
 *
 * Updates referral stage to 'booked', sets booked_at timestamp,
 * and advances nurture stage to 'booked_to_consulted'.
 */
export async function POST(req: NextRequest) {
  const { deny, body } = await verifyGhlSignature(req);
  if (deny) return deny;

  const contactId = (body as Record<string, unknown>).contactId as string
    ?? (body as Record<string, unknown>).contact_id as string;

  if (!contactId) {
    console.warn("[ghl/booked] No contactId in payload");
    return NextResponse.json({ error: "Missing contactId" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Find referral by GHL contact ID
  const referral = await getReferralByGhlContactId(admin, contactId);
  if (!referral) {
    console.warn(`[ghl/booked] No referral found for contact ${contactId}`);
    return NextResponse.json({ received: true, matched: false });
  }

  const now = new Date().toISOString();

  // Update referral stage
  await admin
    .from("referrals")
    .update({
      stage: "booked",
      booked_at: now,
      nurture_stage: "booked_to_consulted",
    })
    .eq("id", referral.id);

  // Log event
  await logPartnerEvent(admin, {
    partner_id: referral.partner_id,
    actor: "system",
    event_type: "referral_booked",
    payload: {
      referral_id: referral.id,
      ghl_contact_id: contactId,
      client_name: `${referral.client_first_name} ${referral.client_last_name}`,
    },
  });

  console.log(`[ghl/booked] Referral ${referral.id} marked as booked`);
  return NextResponse.json({ received: true, matched: true, referralId: referral.id });
}
