import { NextRequest, NextResponse } from "next/server";
import { verifyGhlSignature } from "@/lib/ghl/verifySignature";
import { createAdminClient } from "@/lib/supabase/admin";
import { getReferralByGhlContactId, logPartnerEvent } from "@/lib/supabase/queries";
import { extractAppointmentPayload } from "@/lib/ghl/extract-appointment";

/**
 * GHL Webhook: appointment deleted (cancelled)
 */
export async function POST(req: NextRequest) {
  const { deny, body } = await verifyGhlSignature(req);
  if (deny) return deny;

  const appt = extractAppointmentPayload(body as Record<string, unknown>);
  const contactId = appt.contactId;

  if (!contactId) {
    console.warn("[ghl/appointment-cancelled] No contactId in payload");
    return NextResponse.json({ error: "Missing contactId" }, { status: 400 });
  }

  const admin = createAdminClient();
  const referral = await getReferralByGhlContactId(admin, contactId);
  if (!referral) {
    console.warn(`[ghl/appointment-cancelled] No referral for contact ${contactId}`);
    return NextResponse.json({ received: true, matched: false });
  }

  await admin
    .from("referrals")
    .update({ appointment_status: "cancelled" })
    .eq("id", referral.id);

  await logPartnerEvent(admin, {
    partner_id: referral.partner_id,
    actor: "system",
    event_type: "referral_appointment_cancelled",
    payload: {
      referral_id: referral.id,
      ghl_contact_id: contactId,
      appointment_id: appt.appointmentId,
      cancelled_appointment_time: referral.appointment_at,
    },
  });

  console.log(`[ghl/appointment-cancelled] Referral ${referral.id} appointment cancelled`);
  return NextResponse.json({ received: true, matched: true, referralId: referral.id });
}
