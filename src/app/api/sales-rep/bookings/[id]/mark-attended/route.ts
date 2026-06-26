import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(_req: Request, ctx: RouteContext<"/api/sales-rep/bookings/[id]/mark-attended">) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = createAdminClient();
  const { data: rep } = await admin.from("sales_reps").select("id").eq("auth_user_id", user.id).maybeSingle();
  const { data: booking } = await admin.from("calendar_bookings").select("referral_id, sales_rep_id").eq("id", id).maybeSingle();
  if (!rep || !booking || booking.sales_rep_id !== rep.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await admin.from("calendar_bookings").update({ status: "attended" }).eq("id", id);
  await admin.from("referrals").update({ stage: "consulted", consulted_at: new Date().toISOString(), appointment_status: "completed", consult_no_show: false }).eq("id", booking.referral_id);
  await admin.from("calendar_event_log").insert({ booking_id: id, event_type: "marked_attended", actor: "closer" });
  return NextResponse.json({ ok: true });
}
