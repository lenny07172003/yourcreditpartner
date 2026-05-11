import { NextRequest, NextResponse } from "next/server";
import { validateCron } from "@/lib/cron/validateCron";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/resend";
import { markdownToHtml, wrapInLayout } from "@/lib/email/renderTemplate";
import { NUDGE_VARIATIONS } from "@/lib/email/partner-templates";

/**
 * CRON: partner-nudge
 * Schedule: weekly (Tuesdays at 09:00 UTC)
 *
 * Sends a referral nudge to partners who haven't submitted in the past 7 days.
 * Rotates through 4 variations.
 */
export async function GET(req: NextRequest) {
  const deny = validateCron(req);
  if (deny) return deny;

  const admin = createAdminClient();
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://yourcreditpartner.com";

  // Partners who are active, finished welcome series, no submission in 7 days
  const { data: partners, error } = await admin
    .from("partners")
    .select("id, email, first_name, last_name, last_submission_at, last_nudge_sent_at, welcome_drip_step")
    .eq("status", "active")
    .is("deleted_at", null)
    .gte("welcome_drip_step", 5); // Finished welcome series

  if (error || !partners) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }

  let sent = 0;

  for (const partner of partners) {
    // Skip if they submitted recently
    if (partner.last_submission_at && partner.last_submission_at > sevenDaysAgo) continue;

    // Skip if we nudged recently (within 6 days to avoid double-sends)
    if (partner.last_nudge_sent_at) {
      const sixDaysAgo = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString();
      if (partner.last_nudge_sent_at > sixDaysAgo) continue;
    }

    // Pick a variation (rotate based on partner ID hash)
    const hash = partner.id.charCodeAt(0) + partner.id.charCodeAt(1);
    const weekNumber = Math.floor(now.getTime() / (7 * 24 * 60 * 60 * 1000));
    const variationIndex = (hash + weekNumber) % NUDGE_VARIATIONS.length;
    const variation = NUDGE_VARIATIONS[variationIndex];

    const subject = variation.subject(partner.first_name);
    const bodyMd = variation.body({ firstName: partner.first_name });
    const html = wrapInLayout(
      markdownToHtml(bodyMd),
      `${appUrl}/unsubscribe?partner=${partner.id}`
    );

    const messageId = await sendEmail({
      to: partner.email,
      subject,
      html,
      tags: [{ name: "campaign", value: "partner_nudge" }],
    });

    if (messageId) {
      await admin
        .from("partners")
        .update({ last_nudge_sent_at: now.toISOString() })
        .eq("id", partner.id);

      await admin.from("email_sends").insert({
        partner_id: partner.id,
        campaign: "partner_nudge",
        subject,
        resend_message_id: messageId,
      });
      sent++;
    }
  }

  console.log(`[partner-nudge] Sent: ${sent}`);
  return NextResponse.json({ sent });
}
