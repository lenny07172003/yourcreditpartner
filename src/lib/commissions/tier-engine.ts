import { SupabaseClient } from "@supabase/supabase-js";
import type { CommissionTier, TierInfo } from "@/types/database";
import { OCG_ORG_ID } from "@/lib/org/context";

/**
 * Load active commission tiers from DB, sorted by tier_number.
 */
export async function loadTiers(supabase: SupabaseClient, orgId: string = OCG_ORG_ID): Promise<CommissionTier[]> {
  const { data, error } = await supabase
    .from("commission_tiers")
    .select("*")
    .eq("org_id", orgId)
    .eq("active", true)
    .order("tier_number");

  if (error) throw error;
  return (data ?? []) as CommissionTier[];
}

/**
 * Given a number of closes this month, return the matching tier.
 * Tiers are retroactive — the partner's ENTIRE month recalculates at the new rate.
 *
 * Tier table (from seed):
 *   Tier 1 "Starter"   — 1-9 closes   → 15%
 *   Tier 2 "Producer"  — 10-24 closes  → 20%
 *   Tier 3 "Top Tier"  — 25-39 closes  → 25%
 *   Tier 4 "Elite"     — 40+ closes    → 35%
 */
export function getTierForCloses(tiers: CommissionTier[], closes: number): TierInfo {
  // Default to lowest tier
  let matched = tiers[0];

  for (const tier of tiers) {
    if (closes >= tier.min_closes) {
      matched = tier;
    }
  }

  return {
    tier: matched.tier_number as 1 | 2 | 3 | 4,
    rate: matched.rate,
    displayName: matched.display_name,
    minCloses: matched.min_closes,
    maxCloses: matched.max_closes,
  };
}

/**
 * Get a partner's close count for a given month (YYYY-MM format).
 * Counts commissions (any state except 'voided') in the close_month.
 */
export async function getCloseCountForMonth(
  supabase: SupabaseClient,
  partnerId: string,
  closeMonth: string,
  orgId: string = OCG_ORG_ID
): Promise<number> {
  const { count, error } = await supabase
    .from("commissions")
    .select("id", { count: "exact", head: true })
    .eq("org_id", orgId)
    .eq("partner_id", partnerId)
    .eq("close_month", closeMonth)
    .neq("state", "voided");

  if (error) throw error;
  return count ?? 0;
}

/**
 * Determine the current tier for a partner in a given month.
 * Loads tiers from DB and counts closes.
 */
export async function getPartnerTierForMonth(
  supabase: SupabaseClient,
  partnerId: string,
  closeMonth: string,
  orgId: string = OCG_ORG_ID
): Promise<{ tierInfo: TierInfo; closeCount: number }> {
  const [tiers, closeCount] = await Promise.all([
    loadTiers(supabase, orgId),
    getCloseCountForMonth(supabase, partnerId, closeMonth, orgId),
  ]);

  const tierInfo = getTierForCloses(tiers, closeCount);
  return { tierInfo, closeCount };
}
