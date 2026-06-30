import { NextRequest, NextResponse } from "next/server";
import { verifyGhlSignature } from "@/lib/ghl/verifySignature";
import { createAdminClient } from "@/lib/supabase/admin";
import { getReferralByGhlContactId, logPartnerEvent } from "@/lib/supabase/queries";
import { transitionCommission } from "@/lib/commissions/state-machine";
import { updateOpportunityStage } from "@/lib/ghl/client";
import { recalcMonthCommissions } from "@/lib/commissions/calculate";
import { getPartnerTierForMonth } from "@/lib/commissions/tier-engine";
import { fanOutWebhooks } from "@/lib/integrations/dispatch";
import { markWebhookEventProcessed } from "@/lib/integrations/webhook-events";
import type { CommissionState } from "@/types/database";

/**
 * GHL Webhook: client refunded
 *
 * 1. Updates referral stage to 'refunded'
 * 2. Voids the commission for this referral
 * 3. Decrements monthly stats close count
 * 4. Recalculates remaining commissions for the month (tier may drop)
 */
export async function POST(req: NextRequest) {
  const { deny, body, webhookEventId } = await verifyGhlSignature(req);
  if (deny) return deny;

  const payload = body as Record<string, unknown>;
  const contactId = (payload.contactId ?? payload.contact_id) as string;

  if (!contactId) {
    console.warn("[ghl/refunded] No contactId in payload");
    return NextResponse.json({ error: "Missing contactId" }, { status: 400 });
  }

  const admin = createAdminClient();

  const referral = await getReferralByGhlContactId(admin, contactId);
  if (!referral) {
    console.warn(`[ghl/refunded] No referral found for contact ${contactId}`);
    return NextResponse.json({ received: true, matched: false });
  }

  // 1. Update referral stage
  await admin
    .from("referrals")
    .update({ stage: "refunded" })
    .eq("id", referral.id);

  // 2. Find and void the commission
  const { data: commission } = await admin
    .from("commissions")
    .select("id, state, close_month, partner_id")
    .eq("referral_id", referral.id)
    .neq("state", "voided")
    .maybeSingle();

  if (commission) {
    await transitionCommission(
      admin,
      commission.id,
      commission.state as CommissionState,
      "voided",
      { voided_reason: "client_refunded" }
    );

    // 3. Decrement monthly stats
    const { data: stats } = await admin
      .from("monthly_partner_stats")
      .select("id, close_count")
      .eq("partner_id", commission.partner_id)
      .eq("close_month", commission.close_month)
      .maybeSingle();

    if (stats) {
      const newCount = Math.max(0, stats.close_count - 1);
      await admin
        .from("monthly_partner_stats")
        .update({ close_count: newCount })
        .eq("id", stats.id);

      // 4. Recalculate remaining commissions at (potentially lower) tier rate
      const { tierInfo } = await getPartnerTierForMonth(
        admin,
        commission.partner_id,
        commission.close_month
      );

      const { data: partner } = await admin
        .from("partners")
        .select("commission_rate_override")
        .eq("id", commission.partner_id)
        .single();

      await recalcMonthCommissions(
        admin,
        commission.partner_id,
        commission.close_month,
        tierInfo.rate,
        partner?.commission_rate_override ?? null
      );
    }
  }

  // 5. Log event
  await logPartnerEvent(admin, {
    partner_id: referral.partner_id,
    actor: "system",
    event_type: "referral_refunded",
    payload: {
      referral_id: referral.id,
      ghl_contact_id: contactId,
      voided_commission_id: commission?.id ?? null,
    },
  });

  // Move opportunity to Lost stage + mark status as "lost"
  const lostStageId = process.env.GHL_STAGE_LOST;
  if (referral.ghl_opportunity_id && lostStageId) {
    try {
      await updateOpportunityStage(referral.ghl_opportunity_id, lostStageId, "lost");
    } catch (err) {
      console.error("[ghl/refunded] Failed to move opportunity:", err);
    }
  }

  await fanOutWebhooks(admin, referral.org_id, "referral.refunded", {
    referral_id: referral.id,
    partner_id: referral.partner_id,
    ghl_contact_id: contactId,
    voided_commission_id: commission?.id ?? null,
  }).catch((error) => console.error("[ghl/refunded] webhook fan-out failed:", error));

  await markWebhookEventProcessed(admin, webhookEventId);

  console.log(`[ghl/refunded] Referral ${referral.id} refunded, commission voided`);
  return NextResponse.json({ received: true, matched: true, referralId: referral.id });
}
