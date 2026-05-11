import { SupabaseClient } from "@supabase/supabase-js";
import type { RevenueWaterfall, TierInfo, Partner } from "@/types/database";

const PROCESSING_FEE_RATE = 0.05; // 5%
const CLOSER_SHARE_RATE = 0.15;   // 15%

/**
 * Revenue waterfall:
 *   Gross Revenue
 *   - 5% processing fee
 *   - 15% closer share (of gross after processing)
 *   = Net Revenue
 *   → Partner commission = Net Revenue × tier rate
 *
 * All amounts are in cents to avoid floating-point issues.
 */
export function calculateWaterfall(grossRevenueCents: number): RevenueWaterfall {
  const processingFeeCents = Math.round(grossRevenueCents * PROCESSING_FEE_RATE);
  const afterProcessing = grossRevenueCents - processingFeeCents;
  const closerShareCents = Math.round(afterProcessing * CLOSER_SHARE_RATE);
  const netRevenueCents = afterProcessing - closerShareCents;

  return {
    gross_revenue_cents: grossRevenueCents,
    processing_fee_cents: processingFeeCents,
    closer_share_cents: closerShareCents,
    net_revenue_cents: netRevenueCents,
  };
}

/**
 * Calculate the partner commission amount from net revenue and tier rate.
 * If the partner has a commission_rate_override, that takes precedence.
 */
export function calculateCommission(
  netRevenueCents: number,
  tierInfo: TierInfo,
  partner: Pick<Partner, "commission_rate_override">
): { amountCents: number; rate: number } {
  const rate = partner.commission_rate_override ?? tierInfo.rate;
  const amountCents = Math.round(netRevenueCents * rate);
  return { amountCents, rate };
}

/**
 * Full pipeline: given gross revenue, compute waterfall + partner commission.
 */
export function calculateFullCommission(
  grossRevenueCents: number,
  tierInfo: TierInfo,
  partner: Pick<Partner, "commission_rate_override">
): RevenueWaterfall & { commission_amount_cents: number; commission_rate: number } {
  const waterfall = calculateWaterfall(grossRevenueCents);
  const { amountCents, rate } = calculateCommission(
    waterfall.net_revenue_cents,
    tierInfo,
    partner
  );

  return {
    ...waterfall,
    commission_amount_cents: amountCents,
    commission_rate: rate,
  };
}

/**
 * Recalculate all pending commissions for a partner in a given month
 * at the new tier rate. Used when a partner crosses a tier threshold
 * (retroactive mechanic).
 */
export async function recalcMonthCommissions(
  supabase: SupabaseClient,
  partnerId: string,
  closeMonth: string,
  newRate: number,
  overrideRate: number | null
): Promise<number> {
  const effectiveRate = overrideRate ?? newRate;

  // Get all non-voided commissions for this month
  const { data: commissions, error } = await supabase
    .from("commissions")
    .select("id, net_revenue_cents")
    .eq("partner_id", partnerId)
    .eq("close_month", closeMonth)
    .neq("state", "voided");

  if (error) throw error;
  if (!commissions || commissions.length === 0) return 0;

  let totalRecalculated = 0;

  for (const c of commissions) {
    const newAmount = Math.round(c.net_revenue_cents * effectiveRate);
    const { error: updateError } = await supabase
      .from("commissions")
      .update({
        commission_rate: effectiveRate,
        amount_cents: newAmount,
        last_recalc_at: new Date().toISOString(),
      })
      .eq("id", c.id);

    if (updateError) throw updateError;
    totalRecalculated++;
  }

  return totalRecalculated;
}
