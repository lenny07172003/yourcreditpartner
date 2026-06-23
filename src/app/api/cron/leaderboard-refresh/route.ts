import { NextRequest, NextResponse } from "next/server";
import { validateCron } from "@/lib/cron/validateCron";
import { createAdminClient } from "@/lib/supabase/admin";

/** Refreshes the opt-in leaderboard every five minutes. */
export async function GET(req: NextRequest) {
  const deny = validateCron(req);
  if (deny) return deny;

  const { error } = await createAdminClient().rpc("refresh_leaderboard_rankings");
  if (error) {
    console.error("[leaderboard-refresh] failed", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ refreshed: true, refreshedAt: new Date().toISOString() });
}
