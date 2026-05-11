import { NextRequest, NextResponse } from "next/server";
import { validateCron } from "@/lib/cron/validateCron";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/resend";
import {
  buildNurtureVariables,
  renderNurtureEmail,
} from "@/lib/email/renderTemplate";

/**
 * CRON: client-nurture-dispatcher
 * Schedule: every 15 minutes
 *
 * Sends queued nurture emails to referred clients.
 * Picks up items from client_nurture_queue where:
 *  - scheduled_for <= now
 *  - sent_at IS NULL
 *  - cancelled_at IS NULL
 *
 * For each queued item:
 *  1. Load the template by campaign_step
 *  2. Load the referral + partner data
 *  3. Render the email with variable interpolation
 *  4. Send via Resend
 *  5. Mark as sent + log to client_nurture_sends
 */
export async function GET(req: NextRequest) {
  const deny = validateCron(req);
  if (deny) return deny;

  const admin = createAdminClient();
  const now = new Date().toISOString();

  // Get queued items ready to send
  const { data: queue, error } = await admin
    .from("client_nurture_queue")
    .select("id, referral_id, campaign_step, scheduled_for")
    .is("sent_at", null)
    .is("cancelled_at", null)
    .lte("scheduled_for", now)
    .order("scheduled_for")
    .limit(50);

  if (error) {
    console.error("[nurture-dispatcher] Failed to load queue:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!queue || queue.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  let sent = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      // Load template
      const { data: template } = await admin
        .from("client_nurture_templates")
        .select("subject, body_markdown")
        .eq("campaign_step", item.campaign_step)
        .eq("active", true)
        .single();

      if (!template) {
        console.warn(`[nurture-dispatcher] No active template for step: ${item.campaign_step}`);
        await admin
          .from("client_nurture_queue")
          .update({ cancelled_at: now, cancelled_reason: "template_not_found" })
          .eq("id", item.id);
        failed++;
        continue;
      }

      // Load referral + partner
      const { data: referral } = await admin
        .from("referrals")
        .select("id, client_first_name, client_last_name, client_email, partner_id, nurture_status")
        .eq("id", item.referral_id)
        .single();

      if (!referral || referral.nurture_status === "opted_out") {
        await admin
          .from("client_nurture_queue")
          .update({ cancelled_at: now, cancelled_reason: referral ? "opted_out" : "referral_not_found" })
          .eq("id", item.id);
        failed++;
        continue;
      }

      const { data: partner } = await admin
        .from("partners")
        .select("first_name, last_name, company_name")
        .eq("id", referral.partner_id)
        .single();

      if (!partner) {
        failed++;
        continue;
      }

      // Build variables + render
      const variables = buildNurtureVariables({
        clientFirstName: referral.client_first_name,
        clientLastName: referral.client_last_name,
        partnerFirstName: partner.first_name,
        partnerLastName: partner.last_name,
        partnerCompany: partner.company_name ?? undefined,
        referralId: referral.id,
      });

      const { subject, html } = renderNurtureEmail(
        template.body_markdown,
        template.subject,
        variables
      );

      // Send email
      const messageId = await sendEmail({
        to: referral.client_email,
        subject,
        html,
        tags: [
          { name: "campaign", value: item.campaign_step },
          { name: "referral_id", value: referral.id },
        ],
      });

      if (!messageId) {
        failed++;
        continue;
      }

      // Mark as sent
      await admin
        .from("client_nurture_queue")
        .update({ sent_at: now, resend_message_id: messageId })
        .eq("id", item.id);

      // Log to sends table
      await admin.from("client_nurture_sends").insert({
        referral_id: referral.id,
        campaign_step: item.campaign_step,
        subject,
        resend_message_id: messageId,
      });

      // Update last sent timestamp on referral
      await admin
        .from("referrals")
        .update({ nurture_last_sent_at: now })
        .eq("id", referral.id);

      sent++;
    } catch (err) {
      console.error(`[nurture-dispatcher] Error processing queue item ${item.id}:`, err);
      failed++;
    }
  }

  console.log(`[nurture-dispatcher] Sent: ${sent}, Failed: ${failed}`);
  return NextResponse.json({ sent, failed });
}
