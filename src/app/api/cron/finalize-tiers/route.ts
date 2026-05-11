import { NextRequest, NextResponse } from "next/server";
import { validateCron } from "@/lib/cron/validateCron";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadTiers, getTierForCloses } from "@/lib/commissions/tier-engine";
import { recalcMonthCommissions } from "@/lib/commissions/calculate";

/**
 * CRON: finalize-tiers
 * Schedule: 1st of every month at 00:05 UTC
 *
 * Locks the previous month's tier for every partner who had closes.
 * Recalculates all commissions in that month at the final tier rate.
 * Updates monthly_partner_stats with finalized = true.
 */
export async function GET(req: NextRequest) {
  const deny = validateCron(req);
  if (deny) return deny;

  const admin = createAdminClient();
  const tiers = await loadTiers(admin);

  // Previous month in YYYY-MM format
  const now = new Date();
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const closeMonth = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`;

  // Get all monthly_partner_stats for the previous month that aren't finalized
  const { data: statsRows, error: statsError } = await admin
    .from("monthly_partner_stats")
    .select("id, partner_id, close_count")
    .eq("close_month", closeMonth)
    .eq("finalized", false);

  if (statsError) {
    console.error("[finalize-tiers] Failed to load stats:", statsError);
    return NextResponse.json({ error: statsError.message }, { status: 500 });
  }

  if (!statsRows || statsRows.length === 0) {
    return NextResponse.json({ message: "No stats to finalize", closeMonth });
  }

  let finalized = 0;
  let recalculated = 0;

  for (const row of statsRows) {
    const tierInfo = getTierForCloses(tiers, row.close_count);

    // Get partner's commission_rate_override
    const { data: partner } = await admin
      .from("partners")
      .select("commission_rate_override")
      .eq("id", row.partner_id)
      .single();

    const overrideRate = partner?.commission_rate_override ?? null;

    // Recalculate all commissions for this partner/month at final tier rate
    const count = await recalcMonthCommissions(
      admin,
      row.partner_id,
      closeMonth,
      tierInfo.rate,
      overrideRate
    );
    recalculated += count;

    // Mark stats as finalized
    await admin
      .from("monthly_partner_stats")
      .update({
        finalized: true,
        finalized_at: new Date().toISOString(),
        current_tier: tierInfo.tier,
        current_rate: overrideRate ?? tierInfo.rate,
      })
      .eq("id", row.id);

    finalized++;
  }

  console.log(`[finalize-tiers] ${closeMonth}: finalized ${finalized} partners, recalculated ${recalculated} commissions`);
  return NextResponse.json({ closeMonth, finalized, recalculated });
}
