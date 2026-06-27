import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureReferralAssignment, getAvailableSlots } from "@/lib/calendar/slots";
import { verifyBookingToken } from "@/lib/calendar/token";
import { sendBookingConfirmation } from "@/lib/calendar/notifications";

const bookingSchema = z.object({
  token: z.string().min(1),
  startsAt: z.string().datetime(),
  clientTimezone: z.string().min(1).max(100),
});

export async function POST(req: NextRequest) {
  const parsed = bookingSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Please select a valid appointment time." }, { status: 400 });

  try {
    Intl.DateTimeFormat(undefined, { timeZone: parsed.data.clientTimezone });
  } catch {
    return NextResponse.json({ error: "Please select a valid time zone." }, { status: 400 });
  }

  try {
    const { referralId, orgId } = await verifyBookingToken(parsed.data.token);
    const admin = createAdminClient();
    const { data: referral, error } = await admin
      .from("referrals")
      .select("id, stage, client_first_name, client_last_name, client_email")
      .eq("org_id", orgId)
      .eq("id", referralId)
      .maybeSingle();
    if (error || !referral) return NextResponse.json({ error: "This booking link is no longer available." }, { status: 404 });
    if (!["submitted", "booked"].includes(referral.stage)) return NextResponse.json({ error: "This referral is no longer eligible to book." }, { status: 409 });

    const salesRepId = await ensureReferralAssignment(admin, referral.id);
    const slots = await getAvailableSlots(admin, salesRepId, orgId);
    const selected = slots.find((slot) => slot.startsAt === parsed.data.startsAt);
    if (!selected) return NextResponse.json({ error: "That appointment time is no longer available. Please choose another slot." }, { status: 409 });

    const icsUid = `booking-${referral.id}@yourcreditpartner.com`;
    const { data: bookingId, error: bookingError } = await admin.rpc("upsert_in_house_calendar_booking", {
      p_referral_id: referral.id,
      p_sales_rep_id: selected.salesRepId,
      p_scheduled_for: selected.startsAt,
      p_duration_min: selected.durationMin,
      p_buffer_after_min: selected.bufferAfterMin,
      p_client_timezone: parsed.data.clientTimezone,
      p_ics_uid: icsUid,
      p_actor: "client",
    });
    if (bookingError) {
      const status = bookingError.message.includes("calendar_bookings_no_overlap") ? 409 : 500;
      return NextResponse.json({ error: status === 409 ? "That appointment time was just taken. Please choose another slot." : bookingError.message }, { status });
    }

    sendBookingConfirmation({
      bookingId,
      token: parsed.data.token,
      clientName: `${referral.client_first_name} ${referral.client_last_name}`,
      clientEmail: referral.client_email,
      startsAt: selected.startsAt,
      timezone: parsed.data.clientTimezone,
      salesRepName: selected.salesRepName,
    }).catch((error) => console.error("[calendar/bookings] confirmation email failed", error));

    return NextResponse.json({ bookingId, startsAt: selected.startsAt, endsAt: selected.endsAt, salesRepName: selected.salesRepName });
  } catch (error) {
    console.error("[calendar/bookings]", error);
    return NextResponse.json({ error: "Invalid or expired booking link." }, { status: 401 });
  }
}
