import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createBookingIcs } from "@/lib/calendar/ics";
import { verifyBookingToken } from "@/lib/calendar/token";
import type { CalendarBooking } from "@/lib/calendar/types";

export async function GET(req: NextRequest, ctx: RouteContext<"/api/public/bookings/[id]/ics">) {
  try {
    const { id } = await ctx.params;
    const token = req.nextUrl.searchParams.get("token") ?? "";
    const referralId = await verifyBookingToken(token);
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("calendar_bookings")
      .select("*, referrals!inner(client_first_name, client_last_name), sales_reps!inner(first_name, last_name)")
      .eq("id", id)
      .eq("referral_id", referralId)
      .maybeSingle();
    if (error || !data) return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    const referral = data.referrals as { client_first_name: string; client_last_name: string };
    const rep = data.sales_reps as { first_name: string; last_name: string };
    const ics = createBookingIcs(data as CalendarBooking, `${referral.client_first_name} ${referral.client_last_name}`, `${rep.first_name} ${rep.last_name}`);
    return new NextResponse(ics, { headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": "attachment; filename=yourcreditpartner-consultation.ics" } });
  } catch {
    return NextResponse.json({ error: "Invalid or expired booking link." }, { status: 401 });
  }
}
