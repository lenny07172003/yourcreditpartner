import { NextRequest, NextResponse } from "next/server";
import { validateCron } from "@/lib/cron/validateCron";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const deny = validateCron(req);
  if (deny) return deny;
  const admin = createAdminClient();
  const cutoff = new Date(Date.now() - 15 * 60_000).toISOString();
  const { data: bookings, error } = await admin.from("calendar_bookings").select("id, org_id, referral_id").in("status", ["booked", "rescheduled"]).lt("scheduled_for", cutoff);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  for (const booking of bookings ?? []) {
    await admin.from("calendar_bookings").update({ status: "no_show" }).eq("org_id", booking.org_id).eq("id", booking.id);
    await admin.from("referrals").update({ appointment_status: "no_show", consult_no_show: true, nurture_stage: "noshow_recovery" }).eq("org_id", booking.org_id).eq("id", booking.referral_id);
    await admin.from("calendar_event_log").insert({ org_id: booking.org_id, booking_id: booking.id, event_type: "marked_no_show", actor: "cron" });
  }
  return NextResponse.json({ markedNoShow: bookings?.length ?? 0 });
}
