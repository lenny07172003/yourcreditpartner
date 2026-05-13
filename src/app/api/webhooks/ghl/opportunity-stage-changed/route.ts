import { NextRequest, NextResponse } from "next/server";
import { verifyGhlSignature } from "@/lib/ghl/verifySignature";
import { createAdminClient } from "@/lib/supabase/admin";
import { getReferralByGhlContactId, logPartnerEvent } from "@/lib/supabase/queries";

/**
 * GHL Webhook: opportunity moved to a different pipeline stage
 *
 * Fires when a setter manually drags a card in the GHL pipeline, OR
 * when our app moves an opportunity (idempotent — no-op if already at that stage).
 *
 * Looks up the referral by ghl_contact_id and updates referral.stage
 * to match the new pipeline stage.
 */
export async function POST(req: NextRequest) {
  const { deny, body } = await verifyGhlSignature(req);
  if (deny) return deny;

  const payload = body as Record<string, unknown>;
  const contactId = (payload.contactId ?? payload.contact_id) as string | undefined;
  const opportunityId = (payload.opportunityId ?? payload.opportunity_id ?? payload.id) as string | undefined;
  const newStageId = (payload.pipelineStageId ?? payload.pipeline_stage_id ?? payload.stageId ?? payload.stage_id) as string | undefined;

  if (!newStageId) {
    console.warn("[ghl/opportunity-stage-changed] No pipelineStageId in payload");
    return NextResponse.json({ error: "Missing pipelineStageId" }, { status: 400 });
  }

  // Map GHL stage ID → our referral stage value
  const stageMap: Record<string, { stage: string; appointmentStatus?: string }> = {
    [process.env.GHL_STAGE_NEW_LEAD ?? ""]: { stage: "submitted" },
    [process.env.GHL_STAGE_BOOKED ?? ""]: { stage: "booked" },
    [process.env.GHL_STAGE_CONSULTED ?? ""]: { stage: "consulted" },
    [process.env.GHL_STAGE_CLOSED_WON ?? ""]: { stage: "closed_won" },
    [process.env.GHL_STAGE_IN_SERVICE ?? ""]: { stage: "active_service" },
    [process.env.GHL_STAGE_NO_SHOW ?? ""]: { stage: "booked", appointmentStatus: "no_show" },
    [process.env.GHL_STAGE_LOST ?? ""]: { stage: "refunded" },
  };

  const mapping = stageMap[newStageId];
  if (!mapping) {
    console.warn(`[ghl/opportunity-stage-changed] Unknown stage ID: ${newStageId}`);
    return NextResponse.json({ received: true, matched: false, reason: "unknown_stage" });
  }

  const admin = createAdminClient();

  // Find referral — try by opportunity ID first, fall back to contact ID
  let referral = null;
  if (opportunityId) {
    const { data } = await admin
      .from("referrals")
      .select("*")
      .eq("ghl_opportunity_id", opportunityId)
      .maybeSingle();
    referral = data;
  }

  if (!referral && contactId) {
    referral = await getReferralByGhlContactId(admin, contactId);
  }

  if (!referral) {
    console.warn(`[ghl/opportunity-stage-changed] No referral for opp=${opportunityId} contact=${contactId}`);
    return NextResponse.json({ received: true, matched: false });
  }

  // Skip if already at this stage (idempotent — prevents loops from our own stage updates)
  if (referral.stage === mapping.stage && referral.appointment_status === (mapping.appointmentStatus ?? referral.appointment_status)) {
    return NextResponse.json({ received: true, matched: true, noop: true, referralId: referral.id });
  }

  const updateData: Record<string, unknown> = { stage: mapping.stage };

  // Set the appropriate timestamp if transitioning forward
  const now = new Date().toISOString();
  if (mapping.stage === "booked" && !referral.booked_at) {
    updateData.booked_at = now;
  }
  if (mapping.stage === "consulted" && !referral.consulted_at) {
    updateData.consulted_at = now;
  }
  if (mapping.stage === "closed_won" && !referral.closed_won_at) {
    updateData.closed_won_at = now;
  }
  if (mapping.appointmentStatus) {
    updateData.appointment_status = mapping.appointmentStatus;
    if (mapping.appointmentStatus === "no_show") {
      updateData.consult_no_show = true;
    }
  }

  await admin.from("referrals").update(updateData).eq("id", referral.id);

  await logPartnerEvent(admin, {
    partner_id: referral.partner_id,
    actor: "system",
    event_type: "referral_stage_changed_via_pipeline",
    payload: {
      referral_id: referral.id,
      previous_stage: referral.stage,
      new_stage: mapping.stage,
      ghl_opportunity_id: opportunityId,
      ghl_stage_id: newStageId,
      source: "ghl_pipeline_drag",
    },
  });

  console.log(`[ghl/opportunity-stage-changed] Referral ${referral.id}: ${referral.stage} → ${mapping.stage}`);
  return NextResponse.json({ received: true, matched: true, referralId: referral.id, newStage: mapping.stage });
}
