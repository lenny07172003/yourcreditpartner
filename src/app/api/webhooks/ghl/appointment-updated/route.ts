import { NextRequest, NextResponse } from "next/server";
import { verifyGhlSignature } from "@/lib/ghl/verifySignature";
import { createAdminClient } from "@/lib/supabase/admin";
import { getReferralByGhlContactId, logPartnerEvent } from "@/lib/supabase/queries";
import { extractAppointmentPayload } from "@/lib/ghl/extract-appointment";

/**
 * GHL Webhook: appointment updated (rescheduled or cancelled via update)
 */
export async function POST(req: NextRequest) {
  const { deny, body } = await verifyGhlSignature(req);
  if (deny) return deny;

  const appt = extractAppointmentPayload(body as Record<string, unknown>);
  const contactId = appt.contactId;

  if (!contactId) {
    console.warn("[ghl/appointment-updated] No contactId in payload");
    return NextResponse.json({ error: "Missing contactId" }, { status: 400 });
  }

  const admin = createAdminClient();
  const referral = await getReferralByGhlContactId(admin, contactId);
  if (!referral) {
    console.warn(`[ghl/appointment-updated] No referral for contact ${contactId}`);
    return NextResponse.json({ received: true, matched: false });
  }

  const isCancelled = appt.status === "cancelled";
  const newStatus = isCancelled ? "cancelled" : "rescheduled";

  const updateData: Record<string, unknown> = {
    appointment_status: newStatus,
  };

  if (!isCancelled) {
    updateData.appointment_at = appt.startTime;
    updateData.appointment_end_at = appt.endTime;
    if (appt.appointmentId) updateData.appointment_id = appt.appointmentId;
    if (appt.calendarId) updateData.appointment_calendar_id = appt.calendarId;
  }

  await admin.from("referrals").update(updateData).eq("id", referral.id);

  await logPartnerEvent(admin, {
    partner_id: referral.partner_id,
    actor: "system",
    event_type: isCancelled
      ? "referral_appointment_cancelled"
      : "referral_appointment_rescheduled",
    payload: {
      referral_id: referral.id,
      ghl_contact_id: contactId,
      appointment_id: appt.appointmentId,
      new_start_time: appt.startTime,
      previous_start_time: referral.appointment_at,
      ghl_status: appt.status,
    },
  });

  console.log(`[ghl/appointment-updated] Referral ${referral.id} appointment ${newStatus}`);
  return NextResponse.json({ received: true, matched: true, referralId: referral.id });
}
