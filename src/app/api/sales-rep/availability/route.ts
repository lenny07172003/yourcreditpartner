import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const ruleSchema = z.object({
  weekday: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  timezone: z.string().min(1).max(100),
  bufferBeforeMin: z.number().int().min(0).max(120).default(5),
  bufferAfterMin: z.number().int().min(0).max(120).default(5),
}).refine((rule) => rule.endTime > rule.startTime, { message: "End time must be after start time." });
const payloadSchema = z.object({ rules: z.array(ruleSchema).max(28) });

async function getCurrentRep() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createAdminClient();
  const { data } = await admin.from("sales_reps").select("id").eq("auth_user_id", user.id).eq("status", "active").is("deleted_at", null).maybeSingle();
  return data;
}

export async function GET() {
  const rep = await getCurrentRep();
  if (!rep) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await createAdminClient().from("calendar_availability").select("*").eq("sales_rep_id", rep.id).order("weekday").order("start_time");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ rules: data ?? [] });
}

export async function PUT(req: NextRequest) {
  const rep = await getCurrentRep();
  if (!rep) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = payloadSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid availability rules." }, { status: 400 });
  try { parsed.data.rules.forEach((rule) => Intl.DateTimeFormat(undefined, { timeZone: rule.timezone })); } catch { return NextResponse.json({ error: "Use a valid IANA time zone, such as America/New_York." }, { status: 400 }); }
  const admin = createAdminClient();
  const { error: deleteError } = await admin.from("calendar_availability").delete().eq("sales_rep_id", rep.id);
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });
  if (parsed.data.rules.length) {
    const { error } = await admin.from("calendar_availability").insert(parsed.data.rules.map((rule) => ({ sales_rep_id: rep.id, weekday: rule.weekday, start_time: rule.startTime, end_time: rule.endTime, timezone: rule.timezone, buffer_before_min: rule.bufferBeforeMin, buffer_after_min: rule.bufferAfterMin })));
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
