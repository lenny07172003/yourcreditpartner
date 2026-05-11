import { NextRequest, NextResponse } from "next/server";
import { validateCron } from "@/lib/cron/validateCron";
import { createAdminClient } from "@/lib/supabase/admin";
import { batchTransition } from "@/lib/commissions/state-machine";

/**
 * CRON: promote-to-payable
 * Schedule: weekly (every Monday at 02:00 UTC)
 *
 * Moves all 'earned' commissions to 'payable', making them eligible
 * for the next payout run.
 */
export async function GET(req: NextRequest) {
  const deny = validateCron(req);
  if (deny) return deny;

  const admin = createAdminClient();

  const { data: earned, error } = await admin
    .from("commissions")
    .select("id")
    .eq("state", "earned");

  if (error) {
    console.error("[promote-to-payable] Failed to load commissions:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!earned || earned.length === 0) {
    return NextResponse.json({ promoted: 0 });
  }

  const commissionIds = earned.map((c) => c.id);
  const promoted = await batchTransition(admin, commissionIds, "earned", "payable");

  console.log(`[promote-to-payable] Promoted ${promoted} commissions to payable`);
  return NextResponse.json({ promoted });
}
