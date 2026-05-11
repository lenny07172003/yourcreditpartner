import { NextRequest, NextResponse } from "next/server";
import { validateCron } from "@/lib/cron/validateCron";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * CRON: drip-campaigns
 * Schedule: every 15 minutes
 *
 * Queues nurture emails for referrals based on their current stage.
 * Looks at each referral's nurture_stage and schedules the appropriate
 * campaign steps into client_nurture_queue.
 *
 * Only queues emails that haven't already been queued for that referral + step.
 */
export async function GET(req: NextRequest) {
  const deny = validateCron(req);
  if (deny) return deny;

  const admin = createAdminClient();
  const now = new Date();

  // Get active referrals that need nurturing
  const { data: referrals, error } = await admin
    .from("referrals")
    .select("id, nurture_stage, nurture_status, created_at, booked_at, consulted_at")
    .eq("nurture_status", "active")
    .neq("nurture_stage", "completed")
    .neq("nurture_stage", "dormant");

  if (error) {
    console.error("[drip-campaigns] Failed to load referrals:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!referrals || referrals.length === 0) {
    return NextResponse.json({ queued: 0 });
  }

  // Get all active templates
  const { data: templates } = await admin
    .from("client_nurture_templates")
    .select("campaign_step, stage, delay_minutes")
    .eq("active", true);

  if (!templates) {
    return NextResponse.json({ queued: 0 });
  }

  let queued = 0;

  for (const referral of referrals) {
    // Find templates for this referral's current stage
    const stageTemplates = templates.filter((t) => t.stage === referral.nurture_stage);

    // Determine the anchor time for this stage
    let anchorTime: Date;
    switch (referral.nurture_stage) {
      case "submitted_to_booked":
        anchorTime = new Date(referral.created_at);
        break;
      case "booked_to_consulted":
        anchorTime = referral.booked_at ? new Date(referral.booked_at) : new Date(referral.created_at);
        break;
      case "noshow_recovery":
        anchorTime = referral.booked_at ? new Date(referral.booked_at) : new Date(referral.created_at);
        break;
      case "consulted_to_closed":
        anchorTime = referral.consulted_at ? new Date(referral.consulted_at) : new Date(referral.created_at);
        break;
      default:
        continue;
    }

    for (const template of stageTemplates) {
      // Calculate scheduled time
      const scheduledFor = new Date(anchorTime.getTime() + template.delay_minutes * 60 * 1000);

      // Skip if scheduled time is in the future beyond the next 15-min window
      // (it'll be picked up in a future cron run)
      // But we still queue it now so it's ready when the dispatcher runs

      // Check if already queued
      const { data: existing } = await admin
        .from("client_nurture_queue")
        .select("id")
        .eq("referral_id", referral.id)
        .eq("campaign_step", template.campaign_step)
        .maybeSingle();

      if (!existing) {
        await admin.from("client_nurture_queue").insert({
          referral_id: referral.id,
          campaign_step: template.campaign_step,
          scheduled_for: scheduledFor.toISOString(),
        });
        queued++;
      }
    }
  }

  console.log(`[drip-campaigns] Queued ${queued} emails for ${referrals.length} referrals`);
  return NextResponse.json({ queued, referrals: referrals.length });
}
