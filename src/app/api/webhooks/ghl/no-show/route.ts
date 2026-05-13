import { NextRequest, NextResponse } from "next/server";
import { verifyGhlSignature } from "@/lib/ghl/verifySignature";
import { createAdminClient } from "@/lib/supabase/admin";
import { getReferralByGhlContactId, logPartnerEvent } from "@/lib/supabase/queries";
import { extractAppointmentPayload } from "@/lib/ghl/extract-appointment";
import { updateOpportunityStage } from "@/lib/ghl/client";

/**
 * GHL Webhook: appointment marked as no-show
 *
 * Updates appointment_status to 'no_show', flags consult_no_show,
 * and routes the nurture flow to "noshow_recovery".
 */
export async function POST(req: NextRequest) {
  const { deny, body } = await verifyGhlSignature(req);
  if (deny) return deny;

  const appt = extractAppointmentPayload(body as Record<string, unknown>);
  const contactId = appt.contactId;

  if (!contactId) {
    console.warn("[ghl/no-show] No contactId in payload");
    return NextResponse.json({ error: "Missing contactId" }, { status: 400 });
  }

  const admin = createAdminClient();
  const referral = await getReferralByGhlContactId(admin, contactId);
  if (!referral) {
    console.warn(`[ghl/no-show] No referral for contact ${contactId}`);
    return NextResponse.json({ received: true, matched: false });
  }

  await admin
    .from("referrals")
    .update({
      appointment_status: "no_show",
      consult_no_show: true,
      nurture_stage: "noshow_recovery",
    })
    .eq("id", referral.id);

  await logPartnerEvent(admin, {
    partner_id: referral.partner_id,
    actor: "system",
    event_type: "referral_no_show",
    payload: {
      referral_id: referral.id,
      ghl_contact_id: contactId,
      appointment_id: appt.appointmentId,
      missed_appointment_at: referral.appointment_at,
    },
  });

  // Move opportunity to No Show stage
  const noShowStageId = process.env.GHL_STAGE_NO_SHOW;
  if (referral.ghl_opportunity_id && noShowStageId) {
    try {
      await updateOpportunityStage(referral.ghl_opportunity_id, noShowStageId);
    } catch (err) {
      console.error("[ghl/no-show] Failed to move opportunity:", err);
    }
  }

  console.log(`[ghl/no-show] Referral ${referral.id} marked as no-show`);
  return NextResponse.json({ received: true, matched: true, referralId: referral.id });
}
