import { NextRequest, NextResponse } from "next/server";
import { verifyGhlSignature } from "@/lib/ghl/verifySignature";
import { createAdminClient } from "@/lib/supabase/admin";
import { getReferralByGhlContactId, logPartnerEvent } from "@/lib/supabase/queries";
import { extractAppointmentPayload } from "@/lib/ghl/extract-appointment";
import { updateOpportunityStage } from "@/lib/ghl/client";

/**
 * GHL Webhook: appointment confirmed (booked)
 *
 * Updates referral stage to 'booked', sets booked_at timestamp,
 * and advances nurture stage to 'booked_to_consulted'.
 */
export async function POST(req: NextRequest) {
  const { deny, body } = await verifyGhlSignature(req);
  if (deny) return deny;

  const appt = extractAppointmentPayload(body as Record<string, unknown>);
  const contactId = appt.contactId;

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

  // Update referral stage + appointment details
  await admin
    .from("referrals")
    .update({
      stage: "booked",
      booked_at: now,
      nurture_stage: "booked_to_consulted",
      appointment_id: appt.appointmentId,
      appointment_at: appt.startTime,
      appointment_end_at: appt.endTime,
      appointment_status: "scheduled",
      appointment_calendar_id: appt.calendarId,
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
      appointment_id: appt.appointmentId,
      appointment_at: appt.startTime,
    },
  });

  // Move opportunity to Booked stage in GHL pipeline
  const bookedStageId = process.env.GHL_STAGE_BOOKED;
  if (referral.ghl_opportunity_id && bookedStageId) {
    try {
      await updateOpportunityStage(referral.ghl_opportunity_id, bookedStageId);
    } catch (err) {
      console.error("[ghl/booked] Failed to move opportunity:", err);
    }
  }

  console.log(`[ghl/booked] Referral ${referral.id} marked as booked`);
  return NextResponse.json({ received: true, matched: true, referralId: referral.id });
}
