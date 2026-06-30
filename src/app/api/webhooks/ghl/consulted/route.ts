import { NextRequest, NextResponse } from "next/server";
import { verifyGhlSignature } from "@/lib/ghl/verifySignature";
import { createAdminClient } from "@/lib/supabase/admin";
import { getReferralByGhlContactId, logPartnerEvent } from "@/lib/supabase/queries";
import { updateOpportunityStage } from "@/lib/ghl/client";
import { fanOutWebhooks } from "@/lib/integrations/dispatch";
import { markWebhookEventProcessed } from "@/lib/integrations/webhook-events";

/**
 * GHL Webhook: consultation completed
 *
 * Updates referral stage to 'consulted', sets consulted_at timestamp,
 * and advances nurture stage to 'consulted_to_closed'.
 */
export async function POST(req: NextRequest) {
  const { deny, body, webhookEventId } = await verifyGhlSignature(req);
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

  // Move opportunity to Consulted stage
  const consultedStageId = process.env.GHL_STAGE_CONSULTED;
  if (referral.ghl_opportunity_id && consultedStageId) {
    try {
      await updateOpportunityStage(referral.ghl_opportunity_id, consultedStageId);
    } catch (err) {
      console.error("[ghl/consulted] Failed to move opportunity:", err);
    }
  }

  await fanOutWebhooks(admin, referral.org_id, "referral.consulted", {
    referral_id: referral.id,
    partner_id: referral.partner_id,
    ghl_contact_id: contactId,
    consulted_at: now,
  }).catch((error) => console.error("[ghl/consulted] webhook fan-out failed:", error));

  await markWebhookEventProcessed(admin, webhookEventId);

  console.log(`[ghl/consulted] Referral ${referral.id} marked as consulted`);
  return NextResponse.json({ received: true, matched: true, referralId: referral.id });
}
