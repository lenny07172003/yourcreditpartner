import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPartnerByAuthId } from "@/lib/supabase/queries";

const optInSchema = z.object({
  displayName: z.string().trim().min(2).max(60),
  showCompany: z.boolean().default(false),
});

async function getCurrentPartner() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  return getPartnerByAuthId(supabase, user.id);
}

export async function PUT(req: NextRequest) {
  const partner = await getCurrentPartner();
  if (!partner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = optInSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a display name between 2 and 60 characters." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("partner_leaderboard_opt_in").upsert({
    partner_id: partner.id,
    display_name: parsed.data.displayName,
    show_company: parsed.data.showCompany,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Makes a new opt-in visible without waiting for the next scheduled refresh.
  const { error: refreshError } = await admin.rpc("refresh_leaderboard_rankings");
  if (refreshError) console.error("[leaderboard] refresh after opt-in failed", refreshError);

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const partner = await getCurrentPartner();
  if (!partner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { error } = await admin
    .from("partner_leaderboard_opt_in")
    .delete()
    .eq("partner_id", partner.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { error: refreshError } = await admin.rpc("refresh_leaderboard_rankings");
  if (refreshError) console.error("[leaderboard] refresh after opt-out failed", refreshError);

  return NextResponse.json({ ok: true });
}
