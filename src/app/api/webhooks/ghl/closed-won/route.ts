import { NextRequest, NextResponse } from "next/server";
import { verifyGhlSignature } from "@/lib/ghl/verifySignature";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getReferralByGhlContactId,
  logPartnerEvent,
  upsertMonthlyStats,
} from "@/lib/supabase/queries";
import { calculateFullCommission } from "@/lib/commissions/calculate";
import { getPartnerTierForMonth } from "@/lib/commissions/tier-engine";
import { updateOpportunityStage } from "@/lib/ghl/client";

/**
 * GHL Webhook: deal closed / won
 *
 * 1. Updates referral stage to 'closed_won'
 * 2. Sets refund_window_ends_at = now + 30 days
 * 3. Calculates the revenue waterfall
 * 4. Creates a commission record (state = 'pending')
 * 5. Updates monthly_partner_stats (close count + tier)
 * 6. Logs partner event
 */
export async function POST(req: NextRequest) {
  const { deny, body } = await verifyGhlSignature(req);
  if (deny) return deny;

  const payload = body as Record<string, unknown>;
  const contactId = (payload.contactId ?? payload.contact_id) as string;
  const grossRevenueCents = Number(payload.monetary_value ?? payload.monetaryValue ?? 0) * 100;

  if (!contactId) {
    console.warn("[ghl/closed-won] No contactId in payload");
    return NextResponse.json({ error: "Missing contactId" }, { status: 400 });
  }

  const admin = createAdminClient();

  const referral = await getReferralByGhlContactId(admin, contactId);
  if (!referral) {
    console.warn(`[ghl/closed-won] No referral found for contact ${contactId}`);
    return NextResponse.json({ received: true, matched: false });
  }

  const now = new Date();
  const refundWindowEnd = new Date(now);
  refundWindowEnd.setDate(refundWindowEnd.getDate() + 30);

  const closeMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // 1. Update referral
  await admin
    .from("referrals")
    .update({
      stage: "closed_won",
      closed_won_at: now.toISOString(),
      refund_window_ends_at: refundWindowEnd.toISOString(),
      gross_revenue_cents: grossRevenueCents || null,
      nurture_stage: "completed",
    })
    .eq("id", referral.id);

  // 2. Get partner and compute commission
  const { data: partner } = await admin
    .from("partners")
    .select("id, commission_rate_override")
    .eq("id", referral.partner_id)
    .single();

  if (!partner) {
    console.error(`[ghl/closed-won] Partner ${referral.partner_id} not found`);
    return NextResponse.json({ received: true, matched: true, error: "partner_not_found" });
  }

  // Calculate revenue waterfall + commission
  const result = calculateFullCommission(
    grossRevenueCents,
    (await getPartnerTierForMonth(admin, partner.id, closeMonth)).tierInfo,
    { commission_rate_override: partner.commission_rate_override }
  );

  // Update referral with waterfall amounts
  await admin
    .from("referrals")
    .update({
      processing_fee_cents: result.processing_fee_cents,
      closer_share_cents: result.closer_share_cents,
      net_revenue_cents: result.net_revenue_cents,
    })
    .eq("id", referral.id);

  // 3. Create commission record
  const { data: commissionRow } = await admin.from("commissions").insert({
    referral_id: referral.id,
    partner_id: partner.id,
    close_month: closeMonth,
    net_revenue_cents: result.net_revenue_cents,
    commission_rate: result.commission_rate,
    amount_cents: result.commission_amount_cents,
    state: "pending",
  }).select("id").single();

  // 3b. Partner referral commission (5% override)
  // If this partner was referred by another partner, create a 5% override commission
  const { data: earningPartner } = await admin
    .from("partners")
    .select("referred_by_partner_id")
    .eq("id", partner.id)
    .single();

  if (earningPartner?.referred_by_partner_id && commissionRow) {
    // Check that the referring partner is still active (actively referring)
    const { data: referringPartner } = await admin
      .from("partners")
      .select("id, status, last_submission_at")
      .eq("id", earningPartner.referred_by_partner_id)
      .eq("status", "active")
      .single();

    if (referringPartner) {
      const overrideRate = 0.05;
      const overrideAmount = Math.round(result.commission_amount_cents * overrideRate);

      await admin.from("partner_referral_commissions").insert({
        source_commission_id: commissionRow.id,
        referring_partner_id: referringPartner.id,
        earning_partner_id: partner.id,
        override_rate: overrideRate,
        amount_cents: overrideAmount,
        state: "pending",
      });

      console.log(
        `[ghl/closed-won] 5% override: $${(overrideAmount / 100).toFixed(2)} to partner ${referringPartner.id}`
      );
    }
  }

  // 4. Upsert monthly stats
  const { tierInfo, closeCount } = await getPartnerTierForMonth(admin, partner.id, closeMonth);

  await upsertMonthlyStats(admin, {
    partner_id: partner.id,
    close_month: closeMonth,
    close_count: closeCount,
    total_net_revenue_cents: result.net_revenue_cents,
    current_tier: tierInfo.tier,
    current_rate: partner.commission_rate_override ?? tierInfo.rate,
    projected_earnings_cents: result.commission_amount_cents,
  });

  // 5. Log event
  await logPartnerEvent(admin, {
    partner_id: partner.id,
    actor: "system",
    event_type: "referral_closed_won",
    payload: {
      referral_id: referral.id,
      ghl_contact_id: contactId,
      close_month: closeMonth,
      gross_revenue_cents: grossRevenueCents,
      commission_amount_cents: result.commission_amount_cents,
      tier: tierInfo.tier,
      rate: result.commission_rate,
    },
  });

  console.log(
    `[ghl/closed-won] Referral ${referral.id} closed. Commission: $${(result.commission_amount_cents / 100).toFixed(2)} at ${(result.commission_rate * 100).toFixed(0)}%`
  );

  // Move opportunity to Closed Won stage
  const closedStageId = process.env.GHL_STAGE_CLOSED_WON;
  if (referral.ghl_opportunity_id && closedStageId) {
    try {
      await updateOpportunityStage(referral.ghl_opportunity_id, closedStageId);
    } catch (err) {
      console.error("[ghl/closed-won] Failed to move opportunity:", err);
    }
  }

  return NextResponse.json({
    received: true,
    matched: true,
    referralId: referral.id,
    commissionCents: result.commission_amount_cents,
  });
}
