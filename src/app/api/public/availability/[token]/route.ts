import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureReferralAssignment, getAvailableSlots } from "@/lib/calendar/slots";
import { verifyBookingToken } from "@/lib/calendar/token";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/public/availability/[token]">) {
  try {
    const { token } = await ctx.params;
    const referralId = await verifyBookingToken(token);
    const admin = createAdminClient();
    const { data: referral, error } = await admin
      .from("referrals")
      .select("id, client_first_name, client_last_name, stage")
      .eq("id", referralId)
      .maybeSingle();
    if (error || !referral) return NextResponse.json({ error: "This booking link is no longer available." }, { status: 404 });
    if (!["submitted", "booked"].includes(referral.stage)) return NextResponse.json({ error: "This referral is no longer eligible to book." }, { status: 409 });

    const salesRepId = await ensureReferralAssignment(admin, referral.id);
    const slots = await getAvailableSlots(admin, salesRepId);
    return NextResponse.json({ referral: { firstName: referral.client_first_name, lastName: referral.client_last_name }, slots });
  } catch (error) {
    console.error("[calendar/availability]", error);
    return NextResponse.json({ error: "Invalid or expired booking link." }, { status: 401 });
  }
}
