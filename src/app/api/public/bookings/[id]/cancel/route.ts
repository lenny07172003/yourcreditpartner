import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyBookingToken } from "@/lib/calendar/token";

export async function POST(req: NextRequest, ctx: RouteContext<"/api/public/bookings/[id]/cancel">) {
  try {
    const { id } = await ctx.params;
    const body = await req.json();
    const referralId = await verifyBookingToken(String(body.token ?? ""));
    const admin = createAdminClient();
    const { data: booking } = await admin.from("calendar_bookings").select("referral_id").eq("id", id).maybeSingle();
    if (!booking || booking.referral_id !== referralId) return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    const { error } = await admin.rpc("cancel_in_house_calendar_booking", { p_booking_id: id, p_actor: "client", p_reason: typeof body.reason === "string" ? body.reason.slice(0, 500) : null });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid or expired booking link." }, { status: 401 });
  }
}
