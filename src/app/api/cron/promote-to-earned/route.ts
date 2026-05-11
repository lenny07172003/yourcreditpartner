import { NextRequest, NextResponse } from "next/server";
import { validateCron } from "@/lib/cron/validateCron";
import { createAdminClient } from "@/lib/supabase/admin";
import { batchTransition } from "@/lib/commissions/state-machine";

/**
 * CRON: promote-to-earned
 * Schedule: nightly at 01:00 UTC
 *
 * Moves commissions from 'pending' → 'earned' once the referral's
 * 30-day refund window has passed (refund_window_ends_at <= now).
 */
export async function GET(req: NextRequest) {
  const deny = validateCron(req);
  if (deny) return deny;

  const admin = createAdminClient();
  const now = new Date().toISOString();

  // Find pending commissions whose referral's refund window has ended
  const { data: eligible, error } = await admin
    .from("commissions")
    .select("id, referral_id")
    .eq("state", "pending")
    .not("referral_id", "is", null);

  if (error) {
    console.error("[promote-to-earned] Failed to load commissions:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!eligible || eligible.length === 0) {
    return NextResponse.json({ promoted: 0 });
  }

  // Get referral IDs and check their refund windows
  const referralIds = [...new Set(eligible.map((c) => c.referral_id))];
  const { data: referrals, error: refError } = await admin
    .from("referrals")
    .select("id, refund_window_ends_at")
    .in("id", referralIds)
    .lte("refund_window_ends_at", now);

  if (refError) {
    console.error("[promote-to-earned] Failed to load referrals:", refError);
    return NextResponse.json({ error: refError.message }, { status: 500 });
  }

  if (!referrals || referrals.length === 0) {
    return NextResponse.json({ promoted: 0 });
  }

  const pastWindowIds = new Set(referrals.map((r) => r.id));
  const commissionIds = eligible
    .filter((c) => pastWindowIds.has(c.referral_id))
    .map((c) => c.id);

  if (commissionIds.length === 0) {
    return NextResponse.json({ promoted: 0 });
  }

  const promoted = await batchTransition(admin, commissionIds, "pending", "earned");

  console.log(`[promote-to-earned] Promoted ${promoted} commissions to earned`);
  return NextResponse.json({ promoted });
}
